import { createStore } from 'solid-js/store'

import {
  Accessor,
  JSX,
  createContext,
  createEffect,
  createMemo,
  onCleanup,
} from 'solid-js'

import { Channel, invoke } from '@tauri-apps/api/core'

import { getChatBranchNodes } from '../../../data/api/chat-branch-nodes/get-chat-branch-nodes'
import { sendMessage as sendMessageApi } from '../../../data/api/message-generation/send-message'
import { ChatNode } from '../../../types'

type ChatContextState = {
  branchId: string
  isFetching: boolean
  noMoreNodes: boolean
  nodes: ChatNode[]
  lastNodeId: string
  isGenerating: boolean
}

type ChatContext = {
  state: ChatContextState
  fetchNext: () => void
  pushNode: (args: ChatNode[]) => void
  updateLatestNode: (updater: (node: ChatNode) => ChatNode) => void
  updateNode: (nodeId: string, updater: (node: ChatNode) => ChatNode) => void
  setIsGenerating: (isGenerating: boolean) => void
  sendMessage: (message: string) => Promise<void>
}

export const ChatContext = createContext<ChatContext>({
  state: {
    branchId: '',
    isFetching: false,
    noMoreNodes: false,
    nodes: [],
    lastNodeId: '',
    isGenerating: false,
  },
  fetchNext: () => {},
  pushNode: () => {},
  updateLatestNode: () => {},
  updateNode: () => {},
  setIsGenerating: () => {},
  sendMessage: () => Promise.resolve(),
})

type ChatContextProviderProps = {
  branchId: Accessor<string>
  children: JSX.Element
}

export function ChatContextProvider(props: ChatContextProviderProps) {
  const [state, setState] = createStore<ChatContextState>({
    branchId: '',
    nodes: [],
    isFetching: false,
    noMoreNodes: false,
    lastNodeId: '',
    isGenerating: false,
  })

  const branchId = createMemo(() => props.branchId())

  // Update the branchId when the prop changes
  createEffect(() => {
    setState({
      branchId: props.branchId(),
      nodes: [],
      isFetching: false,
      noMoreNodes: false,
      isGenerating: false,
      lastNodeId: '',
    })
  })

  // Handle re-connect
  createEffect(async () => {
    if (!branchId()) return
    const _branchId = branchId()

    const channel = new Channel<any>()
    channel.onmessage = (event) => {
      console.log('EVENT', event)
      if (event.event === 'generationComplete') {
        return
      }

      setState('isGenerating', true)

      updateLatestNode((node) =>
        node.id !== event.data.nodeId
          ? node
          : {
              ...node,
              activeMessage: {
                ...node.activeMessage!,
                content: event.data.message,
              },
            }
      )
    }

    const isStreaming = await invoke('reconnect', {
      branchId,
      onEvent: channel,
    })

    if (isStreaming === 'NoActiveStream') {
      setState('isGenerating', false)
      return
    }

    onCleanup(() => {
      invoke('unregister_stream', {
        branchId: _branchId,
      })
    })
  })

  // Fetch the initial nodes when the branchId changes
  // Will happen when user switches chats or branches in single chat
  createEffect(() => {
    if (!props.branchId()) return
    const branchId = props.branchId()
    setState('isFetching', true)
    getChatBranchNodes(branchId)
      .then((res) => {
        // console.log("FETCH INITIAL RESPONSE", res);
        setState('lastNodeId', res.nodes[0]?.id)
        setState('nodes', res.nodes)
        setState('noMoreNodes', !res.hasMore)
      })
      .finally(() => {
        setState('isFetching', false)
      })
  })

  const fetchNext = () => {
    if (state.noMoreNodes) return

    if (
      state.isFetching ||
      state.noMoreNodes ||
      !state.branchId ||
      !state.lastNodeId
    )
      return
    setState('isFetching', true)
    getChatBranchNodes(state.branchId, state.lastNodeId)
      .then((res) => {
        console.log('FETCH NEXT RESPONSE', res)

        if (res.nodes.length > 0) {
          setState('nodes', [...res.nodes, ...state.nodes])
        }

        if (!res.hasMore) {
          setState('noMoreNodes', true)
        }
      })
      .finally(() => {
        setState('isFetching', false)
      })
  }

  const pushNode = (args: ChatNode[]) => {
    setState('nodes', [...state.nodes, ...args])
  }

  const updateLatestNode = (updater: (node: ChatNode) => ChatNode) => {
    const currentNodes = state.nodes
    if (currentNodes.length === 0) return

    const latestNode = currentNodes[currentNodes.length - 1]
    const updatedNode = updater(latestNode)

    setState('nodes', [...currentNodes.slice(0, -1), updatedNode])
  }

  const setIsGenerating = (isGenerating: boolean) => {
    setState('isGenerating', isGenerating)
  }

  const sendMessage = async (message: string) => {
    if (state.isGenerating) return
    setState('isGenerating', true)

    const channel = new Channel<any>()
    channel.onmessage = (event) => {
      console.log('EVENT', event)
      if (event.event === 'generationComplete') {
        return setState('isGenerating', false)
      }

      updateLatestNode((node) =>
        node.id !== event.data.nodeId
          ? node
          : {
              ...node,
              activeMessage: {
                ...node.activeMessage!,
                content: event.data.message,
              },
            }
      )
    }

    const newNodes = await sendMessageApi(state.branchId, message, channel)

    pushNode([newNodes.userNode, newNodes.assistantNode])
  }

  const updateNode = (
    nodeId: string,
    updater: (node: ChatNode) => ChatNode
  ) => {
    const currentNodes = state.nodes
    if (currentNodes.length === 0) return

    const updatedNode = updater(
      currentNodes.find((node) => node.id === nodeId)!
    )
    setState(
      'nodes',
      currentNodes.map((node) => (node.id === nodeId ? updatedNode : node))
    )
  }

  const value = {
    state,
    fetchNext,
    pushNode,
    updateLatestNode,
    setIsGenerating,
    sendMessage,
    updateNode,
  }

  return (
    <ChatContext.Provider value={value}>{props.children}</ChatContext.Provider>
  )
}
