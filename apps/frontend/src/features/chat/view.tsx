import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import * as smd from 'streaming-markdown'
import { VList, VListHandle } from 'virtua/solid'

import {
  Accessor,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
} from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { Channel, invoke } from '@tauri-apps/api/core'

import { sendMessage } from '../../data/api/message-generation/send-message'
import { useChatBranchNodes } from '../../data/queries/chat-branch-nodes/use-chat-branch-nodes'
import { useChatBranch } from '../../data/queries/chat-branches/use-chat-branch'
import { useChatBranches } from '../../data/queries/chat-branches/use-chat-branches'
import { useChat } from '../../data/queries/chats/use-chat'
import {
  GET_CHAT_BRANCH_NODES_KEYS,
  GET_CHAT_KEYS,
} from '../../data/utils/query-keys'
import { navigationStore } from '../../stores/navigation.store'
import { Chat, ChatNode } from '../../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { openActionDialog } from '../actions'
import { openContextMenu } from '../context-menu'
import { BlankContent } from './content/blank'
import { ChatContent } from './content/chat'

dayjs.extend(relativeTime)

export function ChatView() {
  return (
    <Switch fallback={<BlankContent />}>
      <Match when={navigationStore.content.id}>
        <ChatContent />
      </Match>
    </Switch>
  )

  const chat = useChat({
    chatId: () => navigationStore.content.id!,
  })

  const branch = useChatBranch({
    branchId: () => chat.data?.currentBranchId!,
  })

  return (
    <>
      <ChatTitleBar />
      {/* 
      <Show when={!navigationStore.content.id}>
        <button
          class="mt-100px"
          onClick={() => {
            invoke("create_chat", {
              name: "New chat",
              workspaceId: "w-default",
            });
          }}
        >
          Create new chat
        </button>
      </Show> */}

      <>
        {/* <pre>{JSON.stringify(chat.data, null, 2)}</pre>
        <pre>{JSON.stringify(branch.data, null, 2)}</pre> */}
        <Show when={branch.data?.id}>
          <Messages branchId={() => branch.data?.id!} />
        </Show>
      </>

      <ChatToolbar />

      <div class="absolute px-14px py-16px bottom-24px gap-3px inset-x-0 mx-auto flex flex-col justify-between bg-gradient-to-bl backdrop-blur-88px from-[#919C98]/5 via-[#B7C8C2]/5 to-[#677C74]/5 rounded-22px shadow-2xl shadow-[#000]/15 max-w-700px">
        <ChatSending branchId={() => branch.data?.id!} />
        {/* <div class="flex items-end justify-between">
          <div>
            <button
              onContextMenu={openContextMenu("chat-ai-model-button", {
                id: chat.data?.id!,
              })}
              class="flex items-center gap-4px text-ui-small text-accent bg-accent/10 rounded-12px px-16px h-32px hover:scale-103 transition-all transition-duration-300 cursor-default active:scale-101"
              onClick={() => {
                openActionDialog("model-selector", {
                  chatId: chat.data?.id!,
                });
              }}
            >
              <div class="i-lucide:brain text-ui-icon-small" />
              <span>Hyperbolic / Llama 3.3. 70B</span>
            </button>
          </div>
          <div>
            <button class="flex items-center justify-center gap-4px text-ui text-accent bg-accent/10 rounded-12px w-36px h-36px cursor-default hover:scale-105 hover:translate-y-[-6px] transition-all transition-duration-300">
              <div class="i-lucide:arrow-up text-15px" />
            </button>
          </div>
        </div> */}
      </div>
    </>
  )
}

function ChatSending({ branchId }: { branchId: Accessor<string> }) {
  const [message, setMessage] = createSignal('')

  const onEvent = new Channel<any>()

  const queryClient = useQueryClient()

  const [thisNodeId, setThisNodeId] = createSignal('')

  const [resMsg, setResMsg] = createSignal('')

  onEvent.onmessage = (event) => {
    console.log(event)
    setResMsg((current) => event.data.message)
  }

  createEffect(() => {
    if (resMsg().length < 1) return
    queryClient.setQueryData(
      GET_CHAT_BRANCH_NODES_KEYS({
        branchId: branchId,
      }),
      (data: any) => ({
        pages: data.pages.map((page: any, index: number) =>
          index === 0
            ? {
                ...page,
                nodes: page.nodes.map((node: any) =>
                  node.id === thisNodeId()
                    ? {
                        ...node,
                        activeMessage: {
                          ...(node?.activeMessage || {}),
                          content: resMsg(),
                        },
                      }
                    : node
                ),
              }
            : page
        ),
        pageParams: data.pageParams,
      })
    )
  })

  return (
    <div>
      <div
        class="grid
    text-sm
    after:px-3.5
    after:py-2.5
    [&>textarea]:text-inherit
    after:text-inherit
    [&>textarea]:resize-none
    [&>textarea]:overflow-hidden
    [&>textarea]:[grid-area:1/1/2/2]
    after:[grid-area:1/1/2/2]
    after:whitespace-pre-wrap
    after:invisible
    after:content-[attr(data-cloned-val)_'_']"
      >
        <textarea
          value={message()}
          onInput={(e) => setMessage(e.target.value)}
          class="w-full text-body bg-transparent appearance-none rounded px-12px py-4px outline-none"
          placeholder="Your message is my command"
        />
      </div>
      <button
        onClick={() => {
          sendMessage(branchId(), message(), onEvent).then((messagePair) => {
            setThisNodeId(messagePair.assistantNode.id)

            queryClient.invalidateQueries({
              queryKey: GET_CHAT_KEYS({
                chatId: () => navigationStore.content.id!,
              }),
            })
          })
        }}
      >
        Send
      </button>
    </div>
  )
}

function ChatTitleBar() {
  const chat = useChat({
    chatId: () => navigationStore.content.id!,
  })

  return (
    <div
      data-tauri-drag-region
      class="flex justify-between items-center h-top-bar px-6px absolute left-0 right-4px top-0 z-50 bg-background/80 backdrop-blur-32px"
    >
      <div class="flex items-center gap-1px text-[#97A6A1]">
        <button class="flex items-center gap-4px hover:bg-accent/10 px-8px rounded-8px h-24px">
          <div class="i-lucide:message-circle text-ui-icon" />
          <span class="text-ui max-w-300px truncate">{chat.data?.name}</span>
        </button>
      </div>

      <div class="flex items-center gap-12px text-muted">
        <ChatBranchesDropdownMenu
          branchId={() => chat.data?.currentBranchId!}
        />
        {/* <ChatBranchesDropdownMenu /> */}
        <button>
          <div class="i-lucide:settings text-ui" />
        </button>
      </div>
    </div>
  )
}

function ChatBranchesDropdownMenu({
  branchId,
}: {
  branchId: Accessor<string>
}) {
  const queryClient = useQueryClient()

  const branches = useChatBranches({
    chatId: () => navigationStore.content.id!,
  })

  const branch = useChatBranch({
    branchId: () => branchId(),
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button class="flex items-center gap-4px hover:bg-accent/10 px-8px rounded-8px h-24px">
          <div class="i-lucide:git-branch text-ui-icon" />
          <span class="text-ui">{branch.data?.name}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {branches.data?.map((branch) => (
          <DropdownMenuItem
            onSelect={() => {
              invoke('update_chat', {
                chatId: navigationStore.content.id!,
                params: {
                  currentBranchId: branch.id,
                },
              }).then(() => {
                queryClient.setQueryData<Chat>(
                  GET_CHAT_KEYS({
                    chatId: () => navigationStore.content.id!,
                  }),
                  (currentChatData) =>
                    currentChatData
                      ? {
                          ...currentChatData,
                          currentBranchId: branch.id,
                        }
                      : undefined
                )
              })
            }}
          >
            <span>{branch.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Messages({ branchId }: { branchId: Accessor<string> }) {
  let virtualListRef!: VListHandle

  const nodes = useChatBranchNodes({
    branchId: branchId,
  })

  const items = createMemo(
    () => nodes.data?.pages.flatMap((page) => page.nodes) ?? []
  )

  // Scroll to the bottom when new messages arrive
  // createEffect(() => {
  //   if (items().length > 0) {
  //     setTimeout(() => {
  //       virtualListRef?.scrollToIndex(items().length - 1, { align: "end" });
  //     }, 100);
  //   }
  // }, [nodes.data]);

  onMount(() => {
    setTimeout(() => {
      virtualListRef?.scrollToIndex(items().length - 1, { align: 'end' })
    }, 100)
  })

  return (
    <VList
      ref={(h) => {
        virtualListRef = h!
      }}
      shift
      onScroll={() => {
        // If scrolled to the top, fetch older messages
        if (virtualListRef.findStartIndex() < 5) {
          console.log('fetching older messages')
          nodes.fetchNextPage()
        }
      }}
      data={items()}
      overscan={8}
      class="size-full scrollbar-app"
    >
      {(node, index) => (
        <div
          classList={{
            'mb-210px': index === items().length - 1,
            'mt-150px': index === 0,
          }}
        >
          <Node node={node} />
        </div>
      )}
    </VList>
  )
}

function Node({ node }: { node: ChatNode }) {
  return (
    <div
      class="mx-auto max-w-700px"
      onContextMenu={openContextMenu('chat-node', {
        id: '',
      })}
    >
      <div
        class="rounded-22px my-10px px-24px py-16px max-w-640px"
        classList={{
          'bg-gradient-to-bl backdrop-blur-88px from-[#919C98]/5 via-[#B7C8C2]/5 to-[#677C74]/5 ml-auto':
            node.nodeType.startsWith('user'),
        }}
      >
        {/* {node.nodeType} | {dayjs(node.createdAt).fromNow()} |{" "}
      {dayjs(node.createdAt).format("DD-MM HH:mm")}|{" "}
      {dayjs().format("HH:mm:ss")} */}
        <div
          class="prose text-body text-16px select-text cursor-auto w-full relative selection:bg-accent/15"
          innerHTML={node.activeMessage?.content}
        />
      </div>
    </div>
  )
}

function ChatToolbar() {
  return (
    <div class="absolute bottom-160px py-3px px-12px gap-4px rounded-22px inset-x-0 mx-auto w-auto w-min flex items-center justify-between bg-gradient-to-bl backdrop-blur-88px from-[#919C98]/5 via-[#B7C8C2]/5 to-[#677C74]/5">
      <button class="size-28px flex items-center justify-center rounded-6px">
        <div class="i-lucide:undo-2 text-ui-icon" />
      </button>

      <button class="size-28px flex items-center justify-center rounded-6px">
        <div class="i-lucide:refresh-ccw text-ui-icon" />
      </button>

      <button class="size-28px flex items-center justify-center rounded-6px">
        <div class="i-lucide:play text-ui-icon" />
      </button>
    </div>
  )
}
