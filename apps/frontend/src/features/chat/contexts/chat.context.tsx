import { createStore } from 'solid-js/store'
import * as smd from 'streaming-markdown'

import {
  Accessor,
  JSX,
  createContext,
  createEffect,
  createMemo,
  onCleanup,
} from 'solid-js'

import { Channel, invoke } from '@tauri-apps/api/core'

import { getAllNodesByBranchId } from '@/data/api/nodes/get-all-nodes-by-branch-id'
import { getAllNodesByBranchIdFormatted } from '@/data/api/nodes/get-all-nodes-by-branch-id-formatted'
import { ChatStreamEventPayload } from '@/shared/types/chat-stream-manager/chat-stream-event-payload.type'
import { ChatEventPayload } from '@/shared/types/event-sessions/chat-event-payload.type'
import { Node } from '@/shared/types/nodes/node.type'
import { ChatNode } from '@/types/models/chat'

import { sendMessage as sendMessageApi } from '../../../data/api/message-generation/send-message'

type ChatContextState = {
  id: string
  branchId: string
  modelId: string
  isFetching: boolean
  noMoreNodes: boolean
  nodes: Node[]
  lastNodeId: string
  isGenerating: boolean
}

type ChatContext = {
  state: ChatContextState
  pushNode: (args: Node[]) => void
  updateLatestNode: (updater: (node: Node) => Node) => void
  updateNode: (nodeId: string, updater: (node: Node) => Node) => void
  setIsGenerating: (isGenerating: boolean) => void
  sendMessage: (message: string) => Promise<void>
  regenerateMessage: (nodeId: string) => Promise<void>
}

export const ChatContext = createContext<ChatContext>({
  state: {
    id: '',
    branchId: '',
    modelId: '',
    isFetching: false,
    noMoreNodes: false,
    nodes: [],
    lastNodeId: '',
    isGenerating: false,
  },
  pushNode: () => {},
  updateLatestNode: () => {},
  updateNode: () => {},
  setIsGenerating: () => {},
  sendMessage: () => Promise.resolve(),
  regenerateMessage: () => Promise.resolve(),
})

type ChatContextProviderProps = {
  branchId: Accessor<string>
  children: JSX.Element
}

export function ChatContextProvider(props: ChatContextProviderProps) {
  const [state, setState] = createStore<ChatContextState>({
    id: '',
    branchId: '',
    nodes: [],
    modelId: '',
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
      modelId: '',
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
      // if (event. === 'generationComplete') {
      //   return setState('isGenerating', false)
      // }

      if (event.event === 'done') {
        setState('isGenerating', false)
        return
      }

      if (event.event === 'chunk') {
        setState('nodes', (nodes) =>
          nodes.map((node) =>
            node.messageId === event.message_id
              ? { ...node, messageContent: event.message_content }
              : node
          )
        )
      }
    }

    await invoke('connect_chat_stream', {
      id: _branchId,
      channel,
    }).catch((err) => {
      console.error('Error connecting chat stream', err)
      setState('isGenerating', false)
    })

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
    getAllNodesByBranchId(branchId)
    getAllNodesByBranchIdFormatted(branchId)
      .then((nodes) => {
        // console.log("FETCH INITIAL RESPONSE", res);
        setState('lastNodeId', nodes[0]?.id)
        setState('nodes', nodes)
        setState('noMoreNodes', nodes.length === 0)
      })
      .finally(() => {
        setState('isFetching', false)
      })
  })

  const pushNode = (args: Node[]) => {
    setState('nodes', [...state.nodes, ...args])
  }

  const updateLatestNode = (updater: (node: Node) => Node) => {
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

    const channel = new Channel<ChatEventPayload>()
    channel.onmessage = (event: ChatStreamEventPayload) => {
      console.log('EVENT', event)
      // if (event. === 'generationComplete') {
      //   return setState('isGenerating', false)
      // }

      if (event.event === 'done') {
        setState('isGenerating', false)
        return
      }

      if (event.event === 'chunk') {
        setState('nodes', (nodes) =>
          nodes.map((node) =>
            node.messageId === event.message_id
              ? { ...node, messageContent: event.message_content }
              : node
          )
        )
      }

      // updateLatestNode((node) =>
      //   node.id !== event.data.nodeId
      //     ? node
      //     : {
      //         ...node,
      //         message_content: event.data.message,
      //       }
      // )
    }

    await invoke('generate_text', {
      branchId: state.branchId,
      message,
      channel,
    }).then(() => {
      getAllNodesByBranchIdFormatted(state.branchId)
        .then((nodes) => {
          console.log('NODES', nodes)
          // console.log("FETCH INITIAL RESPONSE", res);
          setState('lastNodeId', nodes[0]?.id)
          setState('nodes', nodes)
        })
        .finally(() => {
          setState('isFetching', false)
        })
    })
    // pushNode([newNodes.userNode, newNodes.assistantNode])
  }

  const regenerateMessage = async (nodeId: string) => {
    if (state.isGenerating) return
    setState('isGenerating', true)

    const channel = new Channel<ChatEventPayload>((event) => {
      console.log('EVENT', event)
      // if (event. === 'generationComplete') {
      //   return setState('isGenerating', false)
      // }

      if (event.event === 'done') {
        setState('isGenerating', false)
        return
      }

      if (event.event === 'chunk') {
        setState('nodes', (nodes) =>
          nodes.map((node) =>
            node.messageId === event.message_id
              ? { ...node, messageContent: event.message_content }
              : node
          )
        )
      }
    })

    await invoke('regenerate_node', {
      channel,
      payload: {
        id: nodeId,
      },
    }).then(() => {
      getAllNodesByBranchIdFormatted(state.branchId)
        .then((nodes) => {
          console.log('NODES', nodes)
          setState('lastNodeId', nodes[0]?.id)
          setState('nodes', nodes)
        })
        .catch((err) => {
          console.error('Error regenerating message', err)
          setState('isGenerating', false)
        })
    })
  }

  const updateNode = (nodeId: string, updater: (node: Node) => Node) => {
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
    pushNode,
    updateLatestNode,
    setIsGenerating,
    sendMessage,
    regenerateMessage,
    updateNode,
  }

  return (
    <ChatContext.Provider value={value}>{props.children}</ChatContext.Provider>
  )
}
