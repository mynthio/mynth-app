import { Accessor, useContext } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { invoke } from '@tauri-apps/api/core'

import { useChatBranch } from '../../../../data/queries/chat-branches/use-chat-branch'
import { useChatBranches } from '../../../../data/queries/chat-branches/use-chat-branches'
import { useChat } from '../../../../data/queries/chats/use-chat'
import { GET_CHAT_KEYS } from '../../../../data/utils/query-keys'
import { navigationStore } from '../../../../stores/navigation.store'
import { Chat } from '../../../../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../ui/dropdown-menu'
import { ChatContext } from '../../contexts/chat.context'

export function ChatTitleBar() {
  const chat = useChat({
    chatId: () => navigationStore.content.id!,
  })

  const chatContext = useContext(ChatContext)

  return (
    <div
      data-tauri-drag-region
      class="flex justify-between items-center h-top-bar px-6px absolute left-0 right-4px top-0 z-50 bg-background/80 backdrop-blur-32px"
    >
      <div class="flex items-center gap-1px text-[#97A6A1]">
        <button class="flex items-center gap-4px hover:bg-accent/10 px-8px rounded-8px h-24px">
          <div class="i-lucide:message-circle text-ui-icon" />
          <span class="text-ui max-w-300px truncate">{chat.data?.name}</span>
          <span>{chatContext.state.isFetching ? 'loading' : 'done'}</span>
          <span>|</span>
          <span>{chatContext.state.noMoreNodes ? 'No more nodes' : ''}</span>
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
