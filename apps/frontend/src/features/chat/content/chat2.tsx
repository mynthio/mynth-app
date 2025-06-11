import { Field } from '@ark-ui/solid'
import { TextField } from '@kobalte/core/text-field'
import { createShortcut } from '@solid-primitives/keyboard'
import { VList, VListHandle } from 'virtua/solid'

import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  useContext,
} from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { Channel, invoke } from '@tauri-apps/api/core'

import { cloneBranch } from '@/data/api/branches/clone-branch'
import { updateChat } from '@/data/api/chats/update-chat'
import { useBranch } from '@/data/queries/branches/use-branch'
import { useBranchesByChatId } from '@/data/queries/branches/use-branches-by-chat-id'
import { useModel } from '@/data/queries/models/use-model'
import { useNodeMessages } from '@/data/queries/node-messages/use-node-messages'
import {
  BRANCHES_BY_CHAT_ID_KEYS,
  BRANCH_KEYS,
  GET_CHAT_KEYS,
} from '@/data/utils/query-keys'
import { openContextMenu } from '@/features/context-menu'
import { Branch } from '@/shared/types/branch/branch.type'
import { Chat } from '@/shared/types/chat/chat.type'
import { ChatEventPayload } from '@/shared/types/event-sessions/chat-event-payload.type'
import { Node } from '@/shared/types/nodes/node.type'
import { Dialog, DialogContent, DialogLabel, DialogTrigger } from '@/ui/dialog'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuItemGroup,
  MenuItemGroupLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/ui/menu'

import mynthLogo from '../../../assets/mynth-logo.png'
import { sendMessage } from '../../../data/api/message-generation/send-message'
import { useAiModels } from '../../../data/queries/ai-models/use-ai-models'
import { useChatBranch } from '../../../data/queries/chat-branches/use-chat-branch'
import { useChat } from '../../../data/queries/chats/use-chat'
import { state } from '../../../features/tabs/tabs.store'
import { ChatNode } from '../../../types'
import { Card } from '../../../ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/tooltip'
import { openDialog } from '../../dialogs'
import {
  ChatSettingsContextProvider,
  useChatSettings,
} from '../contexts/chat-settings.context'
import { ChatContext, ChatContextProvider } from '../contexts/chat.context'

export function ChatContent() {
  const tab = createMemo(() => {
    return state.tabs.find((t) => t.id === state.currentTab)
  })

  const chat = useChat({
    chatId: () => {
      const currentTab = tab()
      if (currentTab?.type === 'chat') {
        return (currentTab as any).data.chatId
      }
      return undefined
    },
  })

  return (
    <ChatSettingsContextProvider>
      <ChatContextProvider branchId={() => chat.data?.currentBranchId!}>
        <div id="markdown" />
        <Content />

        <KbdShortcuts />
      </ChatContextProvider>
    </ChatSettingsContextProvider>
  )
}

function KbdShortcuts() {
  const chatContext = useContext(ChatContext)
  const chatSettings = useChatSettings()

  const node = createMemo(() => {
    return chatContext.state.nodes[chatContext.state.nodes.length - 1]
  })

  createShortcut(
    ['Meta', 'ArrowRight'],
    () => {
      invoke('switch_active_message_version', {
        nodeId: node().id,
        versionNumber:
          (node().messageVersionNumber
            ? Number(node().messageVersionNumber)
            : 1) + 1,
      }).then((response: any) => {
        console.log(response)
        chatContext.updateNode(node().id, (node) => ({
          ...node,
          messageId: response.id,
          messageContent: response.content,
          messageVersionNumber: response.versionNumber,
        }))
      })
    },
    { preventDefault: true, requireReset: false }
  )

  createShortcut(
    ['Meta', 'ArrowLeft'],
    () => {
      invoke('switch_active_message_version', {
        nodeId: node().id,
        versionNumber:
          (node().messageVersionNumber
            ? Number(node().messageVersionNumber)
            : 1) - 1,
      }).then((response: any) => {
        console.log(response)
        chatContext.updateNode(node().id, (node) => ({
          ...node,
          messageId: response.id,
          messageContent: response.content,
          messageVersionNumber: response.versionNumber,
        }))
      })
    },
    { preventDefault: true, requireReset: false }
  )

  createShortcut(
    ['Meta', 'R'],
    () => {
      const channel = new Channel()
      channel.onmessage = (event: any) => {
        const { nodeId, message, messageId } =
          event?.payload || event?.data || {}

        chatContext.updateNode(nodeId, (node) => ({
          ...node,
          messageId: messageId,
          messageContent: message,
          messageVersionNumber: node.messageVersionCount
            ? node.messageVersionCount + BigInt(1)
            : BigInt(1),
        }))
      }

      invoke('regenerate_message', {
        nodeId: node().id,
        channel: channel,
      }).then(() => {
        chatContext.updateNode(node().id, (node) => ({
          ...node,
          messageVersionCount: node.messageVersionCount
            ? node.messageVersionCount + BigInt(1)
            : BigInt(1),
        }))
      })
    },
    { preventDefault: true, requireReset: false }
  )
  return null
}

function Content() {
  const chatContext = useContext(ChatContext)
  const chatSettings = useChatSettings()
  const queryClient = useQueryClient()
  const promptMode = createMemo(() => chatSettings.prompt().mode)
  const branch = useBranch({
    branchId: () => chatContext.state.branchId,
  })
  const chat = useChat({
    chatId: () => branch.data?.chatId!,
  })
  const branches = useBranchesByChatId({
    chatId: () => branch.data?.chatId!,
  })
  return (
    <>
      <div class="absolute z-99999 top-10px right-10px flex items-center gap-8px">
        {/* <button
          class="bg-elements-background absolute z-99999 top-10px left-10px"
          onClick={() => cloneBranch(chatContext.state.branchId)}
        >
          Clone Branch
        </button> */}
        <Menu>
          <MenuTrigger class="text-ui bg-elements-background-soft px-12px h-28px rounded-9px flex items-center gap-4px cursor-default">
            <div class="i-lucide:git-branch text-ui-icon" />
            {branch.data?.name}
          </MenuTrigger>
          <MenuContent>
            <div class="px-12px py-8px">
              <Field.Root>
                <Field.Input
                  placeholder="Search..."
                  class="bg-elements-background-soft px-8px py-6px rounded-8px w-full outline-none text-ui-small"
                />
              </Field.Root>
            </div>
            <Show when={branches.data?.length && chatContext.state.branchId}>
              <For each={branches.data}>
                {(branch1) => (
                  <MenuItem
                    classList={{
                      'bg-accent/10': branch1.id === chatContext.state.branchId,
                    }}
                    onSelect={() => {
                      updateChat({
                        id: branch1.chatId,
                        currentBranchId: branch1.id,
                        name: null,
                      }).then(() => {
                        queryClient.setQueryData<Chat>(
                          GET_CHAT_KEYS({
                            chatId: () => branch1.chatId,
                          }),
                          (oldData) =>
                            oldData
                              ? {
                                  ...oldData,
                                  currentBranchId: branch1.id,
                                }
                              : undefined
                        )
                      })
                    }}
                    value={branch1.id}
                  >
                    {branch1.name}
                  </MenuItem>
                )}
              </For>
            </Show>
            <MenuSeparator />
            <MenuItemGroup>
              <MenuItemGroupLabel>Actions</MenuItemGroupLabel>
              <MenuItem
                onSelect={() => {
                  cloneBranch(chatContext.state.branchId).then(
                    (clonedBranch) => {
                      updateChat({
                        id: clonedBranch.chatId,
                        currentBranchId: clonedBranch.id,
                        name: null,
                      }).then(() => {
                        queryClient.setQueryData<Chat>(
                          GET_CHAT_KEYS({
                            chatId: () => clonedBranch.chatId,
                          }),
                          (oldData) =>
                            oldData
                              ? {
                                  ...oldData,
                                  currentBranchId: clonedBranch.id,
                                }
                              : undefined
                        )

                        queryClient.setQueryData<Branch[]>(
                          BRANCHES_BY_CHAT_ID_KEYS({
                            chatId: () => clonedBranch.chatId,
                          }),
                          (oldData) =>
                            oldData
                              ? [...oldData, clonedBranch]
                              : [clonedBranch]
                        )
                      })
                    }
                  )
                }}
                value="clone-branch"
              >
                Clone "{branch.data?.name}"
              </MenuItem>
            </MenuItemGroup>
          </MenuContent>
        </Menu>
      </div>

      <Show when={chatContext.state.nodes.length > 0}>
        <Nodes />
      </Show>
      <Show when={promptMode() === 'floating'}>
        <Prompter />
      </Show>
    </>
  )
}

function Nodes() {
  const chatContext = useContext(ChatContext)

  let virtualListRef!: VListHandle

  onMount(() => {
    setTimeout(() => {
      virtualListRef?.scrollToIndex(chatContext.state.nodes.length, {
        align: 'end',
      })
    }, 0)
  })

  createEffect(() => {
    if (chatContext.state.isGenerating) {
      virtualListRef?.scrollToIndex(chatContext.state.nodes.length, {
        align: 'end',
        offset: 150,
      })
    }
  })

  return (
    <VList
      ref={(h) => {
        virtualListRef = h!
      }}
      class="size-full scrollbar-app px-24px mx-auto"
      data={[...chatContext.state.nodes, 'FOOTER' as const]}
      overscan={10}
    >
      {(node, index) =>
        node === 'FOOTER' ? (
          <Footer />
        ) : (
          <NodeWrapper node={node} index={index()} />
        )
      }
    </VList>
  )
}

function Footer() {
  const chatContext = useContext(ChatContext)
  const chatSettings = useChatSettings()
  const promptMode = createMemo(() => chatSettings.prompt().mode)

  const node = createMemo(() => {
    return chatContext.state.nodes[chatContext.state.nodes.length - 1]
  })

  return (
    <div
      classList={{
        'h-200px': promptMode() === 'floating',
        'py-24px': promptMode() !== 'floating',
      }}
    >
      {/* <div
        class="flex items-center gap-8px mt-10px absolute top-0px left-0 right-0 mx-auto inset-x-0 bg-elements-background w-auto w-max
        rounded-default py-8px px-16px
        text-ui
        "
      >
        <button
          disabled={
            (node().messageVersionNumber
              ? Number(node().messageVersionNumber)
              : 1) <= 1
          }
          class="disabled:opacity-50 disabled:cursor-default"
          onClick={() => {
            invoke('switch_active_message_version', {
              nodeId: node().id,
              versionNumber:
                (node().messageVersionNumber
                  ? Number(node().messageVersionNumber)
                  : 1) - 1,
            }).then((response: any) => {
              console.log(response)
              chatContext.updateNode(node().id, (node) => ({
                ...node,
                messageId: response.id,
                messageContent: response.content,
                messageVersionNumber: response.versionNumber,
              }))
            })
          }}
        >
          <div class="i-lucide:arrow-left" />
        </button>
        {node().messageVersionNumber ? Number(node().messageVersionNumber) : 1}{' '}
        / {node().messageVersionCount ? Number(node().messageVersionCount) : 1}
        <button
          class="disabled:opacity-50 disabled:cursor-default"
          disabled={
            (node().messageVersionNumber
              ? Number(node().messageVersionNumber)
              : 1) >=
            (node().messageVersionCount
              ? Number(node().messageVersionCount)
              : 1)
          }
          onClick={() => {
            invoke('switch_active_message_version', {
              nodeId: node().id,
              versionNumber:
                (node().messageVersionNumber
                  ? Number(node().messageVersionNumber)
                  : 1) + 1,
            }).then((response: any) => {
              console.log(response)
              chatContext.updateNode(node().id, (node) => ({
                ...node,
                messageId: response.id,
                messageContent: response.content,
                messageVersionNumber: response.versionNumber,
              }))
            })
          }}
        >
          <div class="i-lucide:arrow-right" />
        </button>
        <div class="w-1px h-10px bg-[#323535] mx-8px" />
        <button
          class="flex items-center gap-2px"
          onClick={() => {
            const channel = new Channel()
            channel.onmessage = (event: any) => {
              const { nodeId, message, messageId } =
                event?.payload || event?.data || {}

              chatContext.updateNode(nodeId, (node) => ({
                ...node,
              }))
            }

            invoke('regenerate_message', {
              nodeId: node().id,
              channel: channel,
            }).then(() => {
              chatContext.updateNode(node().id, (node) => ({
                ...node,
                messageVersionCount: node.messageVersionCount
                  ? node.messageVersionCount + BigInt(1)
                  : BigInt(1),
              }))
            })
          }}
        >
          <div class="i-lucide:refresh-cw text-ui-icon-small" />
        </button>
      </div> */}

      <Show when={promptMode() !== 'floating'}>
        <Prompter />
      </Show>
    </div>
  )
}

function NodeWrapper({ node, index }: { node: Node; index: number }) {
  return (
    <div class="py-12px mx-auto max-w-960px">
      <Switch>
        <Match when={node.role === 'user'}>
          <UserNode node={node} />
        </Match>
        <Match when={node.role === 'assistant'}>
          <AssistantNode node={node} />
        </Match>
      </Switch>
    </div>
  )
}

function AssistantNode({ node }: { node: Node }) {
  const chatContext = useContext(ChatContext)

  const messagesCount = createMemo(() =>
    node.messageVersionCount ? Number(node.messageVersionCount) : 0
  )

  const testCtn = <div />

  return (
    <Card variant="ghost">
      <div class="flex items-center gap-5px group">
        <img
          width={28}
          height={28}
          draggable={false}
          src={mynthLogo}
          class="pointer-events-none select-none"
        />

        <span class="text-ui-small">Assistant</span>

        <div class="flex items-center gap-2px group-hover:opacity-100 opacity-0 transition-opacity">
          <div class="flex items-center gap-2px">
            <div class="i-lucide:message-circle text-18px" />
            <span class="text-ui-small">{messagesCount()}</span>
          </div>
        </div>
      </div>
      {/* <AssistantNodeContent node={node} /> */}
      {testCtn}

      <div class="flex items-center gap-12px cursor-default">
        <button
          class="size-26px cursor-default hover:bg-elements-background-soft rounded-8px hover:scale-110 flex items-center justify-center transition-all duration-300"
          onClick={() => {
            chatContext.regenerateMessage(node.id, testCtn)
          }}
        >
          <div class="i-lucide:refresh-cw text-12px" />
        </button>
        <div class="flex items-center gap-2px">
          <button class="size-22px cursor-default hover:bg-elements-background-soft rounded-8px hover:scale-110 flex items-center justify-center transition-all duration-300">
            <div class="i-lucide:chevron-left text-12px" />
          </button>
          <Dialog>
            <DialogTrigger>
              <button class="cursor-default text-12px h-22px px-8px hover:bg-elements-background-soft rounded-8px hover:scale-110 flex items-center justify-center transition-all duration-300">
                {node.messageVersionNumber
                  ? Number(node.messageVersionNumber) + 1
                  : 1}
                /
                {node.messageVersionCount
                  ? Number(node.messageVersionCount)
                  : 1}
              </button>
            </DialogTrigger>
            <DialogContent class="min-w-600px h-80%">
              <VersionsDialogContent
                nodeId={node.id}
                currentMessageId={node.messageId}
              />
            </DialogContent>
          </Dialog>
          <button class="size-22px cursor-default hover:bg-elements-background-soft rounded-8px hover:scale-110 flex items-center justify-center transition-all duration-300">
            <div class="i-lucide:chevron-right text-12px" />
          </button>
        </div>
      </div>
    </Card>
  )
}

function VersionsDialogContent({
  nodeId,
  currentMessageId,
}: {
  nodeId: string
  currentMessageId: string | null
}) {
  const nodeMessages = useNodeMessages({
    nodeId: () => nodeId,
  })

  const [selectedMessage, setSelectedMessage] = createSignal<string | null>(
    currentMessageId
  )

  const previewContent = createMemo(() => {
    return (
      nodeMessages.data?.find(
        (nodeMessage) => nodeMessage.id === selectedMessage()
      )?.content ?? nodeMessages.data?.[0]?.content
    )
  })

  return (
    <div class="w-full h-full grid grid-cols-2 gap-24px px-12px">
      <div class="scrollbar-app overflow-auto h-full space-y-12px">
        <For each={nodeMessages.data || []}>
          {(nodeMessage) => (
            <div>
              <button
                onMouseEnter={() => setSelectedMessage(nodeMessage.id)}
                onClick={() => {}}
                class="w-full text-left"
              >
                <h3>
                  Version {Number(nodeMessage.versionNumber) + 1}
                  {nodeMessage.id === currentMessageId && ' (current)'}
                </h3>
                <div class="text-muted text-12px leading-snug">
                  {nodeMessage.content.slice(0, 200)}
                </div>
              </button>
            </div>
          )}
        </For>
      </div>

      <div class="bg-elements-background-soft rounded-12px px-24px py-12px overflow-auto scrollbar-app">
        <div class="prose" innerHTML={previewContent()} />
      </div>
    </div>
  )
}

function AssistantNodeContent({ node }: { node: Node }) {
  const contentDiv = document.createElement('div')
  contentDiv.className =
    'prose select-text cursor-auto w-full relative selection:bg-accent/15 max-w-800px'
  contentDiv.innerHTML = node.messageContent || ''

  const preElements = contentDiv.getElementsByTagName('pre')

  Array.from(preElements).forEach((pre) => {
    const wrapper = document.createElement('div')

    const mockedExtensions = [
      {
        label: 'Run Code',
        handler: 'handleCodeBlockClick',
      },
    ]

    // Create toolbar elements imperatively to avoid mixing JSX and direct DOM manipulation causing type errors
    const toolbarDiv = document.createElement('div')
    toolbarDiv.className =
      'flex items-center justify-between px-10px h-38px sticky top-5px'
    const emptyDiv = document.createElement('div')
    const buttonsDiv = document.createElement('div')
    buttonsDiv.className = 'flex items-center gap-2px'
    const copyButton = document.createElement('button')
    copyButton.className =
      'size-22px rounded-4px flex items-center justify-center cursor-default hover:scale-110 transition-all active:scale-105 transition-duration-300 hover:text-white'
    const copyIcon = document.createElement('div')
    copyIcon.className = 'i-lucide:copy text-ui-icon' // Assuming UnoCSS handles this class
    copyButton.appendChild(copyIcon)

    mockedExtensions.forEach((extension) => {
      const button = document.createElement('button')
      button.className =
        'h-22px rounded-4px flex items-center justify-center cursor-default hover:scale-110 transition-all active:scale-105 transition-duration-300 hover:text-white'
      button.innerHTML = extension.label
      button.onclick = async () => {
        const handler = await import(
          // @ts-ignore
          `/Users/tom/Library/Application Support/com.mynth.macos/extensions/poc/handlers.js`
        ).then((handlers) => handlers[extension.handler])

        handler(
          { rawCode: 'raw code', messageId: 'message id' },
          {
            openModal: (payload: any) => {
              console.log('open modal from extension!!!!', payload)

              openDialog({
                id: 'extension',
                size: 'medium',
                payload: {
                  payload: payload,
                  extensionId: 'poc',
                  modalHandlerName: 'CodeRunnerModal',
                },
              })
            },
          }
        )
      }
      buttonsDiv.appendChild(button)
    })

    buttonsDiv.appendChild(copyButton)
    toolbarDiv.appendChild(emptyDiv)
    toolbarDiv.appendChild(buttonsDiv)

    wrapper.className = 'relative rounded-12px bg-elements-background'
    pre.style.background = 'none'
    pre.style.padding = '0 20px 20px 20px'
    pre.style.margin = '0'
    pre.classList.add('scrollbar-app')

    wrapper.appendChild(toolbarDiv)
    wrapper.appendChild(pre.cloneNode(true))
    pre.parentNode?.replaceChild(wrapper, pre)
  })

  return <div class="px-12px">{contentDiv}</div>
}

function UserNode({ node }: { node: Node }) {
  return (
    <Card class="ml-auto">
      <div
        class="prose select-text cursor-auto relative selection:bg-accent/15"
        innerHTML={node.messageContent || ''}
      />
    </Card>
  )
}

function Prompter() {
  const chatContext = useContext(ChatContext)
  const [message, setMessage] = createSignal('')
  const [isFocused, setIsFocused] = createSignal(false)

  const chatSettings = useChatSettings()
  const promptMode = createMemo(() => chatSettings.prompt().mode)

  const branch = useBranch({
    branchId: () => chatContext.state.branchId,
  })

  const model = useModel({
    modelId: () => branch.data?.modelId!,
  })

  createShortcut(
    ['Meta', 'Enter'],
    () => {
      onSubmit()
    },
    { preventDefault: true, requireReset: false }
  )

  const onSubmit = async () => {
    if (message().trim() === '') return
    await chatContext.sendMessage(message().trim()).then(() => {
      setMessage('')
    })
  }

  return (
    <div
      classList={{
        absolute: promptMode() === 'floating',
        'border-elements-background-soft shadow-elements-background-soft/15':
          isFocused(),
        'border-transparent': !isFocused(),
      }}
      class="border-2px transition-all duration-500 bottom-24px px-6px py-4px gap-3px inset-x-0 mx-auto flex flex-col justify-between backdrop-blur-88px 
      bg-gradient-to-t
      from-elements-background/70 
      to-elements-background-soft/70
      rounded-22px shadow-2xl shadow-[#000]/5 max-w-700px"
    >
      <TextField
        class="mt-8px"
        value={message()}
        onChange={setMessage}
        onFocusIn={() => setIsFocused(true)}
        onFocusOut={() => setIsFocused(false)}
      >
        <TextField.TextArea
          placeholder="Ask me anything..."
          class="bg-transparent outline-none resize-none w-full text-sm max-h-200px scrollbar-app px-8px py-6px"
          autoResize
        />
      </TextField>
      <div class="flex items-center justify-between mt-1px px-12px py-4px">
        <Show when={chatContext.state.branchId}>
          <div class="flex items-center gap-2px">
            <button
              class="text-muted text-13px h-28px items-center hover:bg-elements-background-soft flex justify-center rounded-12px gap-8px px-8px cursor-default"
              onClick={() => {
                openDialog({
                  id: 'chat-model-selection',
                  size: 'medium',
                  payload: {
                    branchId: chatContext.state.branchId,
                  },
                })
              }}
              onContextMenu={openContextMenu('chat-ai-model-button', {
                id: chatContext.state.branchId,
              })}
            >
              <div class="i-lucide:brain" />
              <span class="text-ui-small">{model.data?.display_name}</span>
            </button>
            {/* 
          <button
            class="text-muted text-13px size-28px hover:bg-elements-background-soft flex items-center justify-center rounded-8px"
            onClick={() => {
              openDialog({
                id: 'chat-system-prompt-dialog',
                size: 'medium',
                payload: {
                  branchId: chatContext.state.branchId,
                },
              })
            }}
          >
            <div class="i-lucide:bot" />
            </button> */}
          </div>
        </Show>
        <div class="flex items-center gap-8px">
          <Tooltip
            placement="top"
            floatingOptions={{ offset: 10 }}
            hoverableContent={false}
          >
            <TooltipContent>Options</TooltipContent>
            <TooltipTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button
                    class="size-24px rounded-8px text-ui-icon-small text-muted flex items-center justify-center cursor-default
                hover:scale-105 hover:bg-accent/15 transition-all transition-duration-300
                hover:shadow-md hover:shadow-accent/10"
                  >
                    <div class="i-lucide:sliders-horizontal" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() =>
                      chatSettings.setPromptMode(
                        promptMode() === 'floating' ? 'docked' : 'floating'
                      )
                    }
                  >
                    {promptMode() === 'floating'
                      ? 'Switch to Docked'
                      : 'Switch to Floating'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
          </Tooltip>

          <Tooltip
            hoverableContent={false}
            placement="top"
            floatingOptions={{
              offset: 10,
            }}
          >
            <TooltipContent>Send Message (⌘ + Enter)</TooltipContent>
            <TooltipTrigger>
              <button
                disabled={chatContext.state.isGenerating}
                class="
            cursor-default size-32px bg-elements-background-soft rounded-12px flex items-center justify-center
            hover:scale-105 hover:bg-accent/15 transition-all transition-duration-300
            hover:shadow-md hover:shadow-accent/10
            "
                onClick={onSubmit}
              >
                <Show
                  when={!chatContext.state.isGenerating}
                  fallback={<div class="i-lucide:loader-circle animate-spin" />}
                >
                  <div class="i-lucide:arrow-up" />
                </Show>
              </button>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
