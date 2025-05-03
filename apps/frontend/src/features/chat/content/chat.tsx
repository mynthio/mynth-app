import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
  useContext,
} from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { ChatContext, ChatContextProvider } from "../contexts/chat.context";
import { useChat } from "../../../data/queries/chats/use-chat";
import { ChatNode } from "../../../types";
import { VList, VListHandle } from "virtua/solid";
import { Card } from "../../../ui/card";
import { Channel, invoke } from "@tauri-apps/api/core";
import { sendMessage } from "../../../data/api/message-generation/send-message";
import mynthLogo from "../../../assets/mynth-logo.png";
import { createShortcut } from "@solid-primitives/keyboard";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { state } from "../../../features/tabs/tabs.store";
import {
  ChatSettingsContextProvider,
  useChatSettings,
} from "../contexts/chat-settings.context";
import { openDialog } from "../../dialogs";
import { useChatBranch } from "../../../data/queries/chat-branches/use-chat-branch";
import { useAiModels } from "../../../data/queries/ai-models/use-ai-models";
export function ChatContent() {
  const tab = createMemo(() => {
    return state.tabs.find((t) => t.id === state.currentTab);
  });

  const chat = useChat({
    chatId: () => tab()?.data.chatId!,
  });

  return (
    <ChatSettingsContextProvider>
      <ChatContextProvider branchId={() => chat.data?.currentBranchId!}>
        <Content />
        <KbdShortcuts />
      </ChatContextProvider>
    </ChatSettingsContextProvider>
  );
}

function KbdShortcuts() {
  const chatContext = useContext(ChatContext);
  const chatSettings = useChatSettings();

  const node = createMemo(() => {
    return chatContext.state.nodes[chatContext.state.nodes.length - 1];
  });

  createShortcut(
    ["Meta", "ArrowRight"],
    () => {
      invoke("switch_active_message_version", {
        nodeId: node().id,
        versionNumber: node().activeMessage?.versionNumber! + 1,
      }).then((response) => {
        console.log(response);
        chatContext.updateNode(node().id, (node) => ({
          ...node,
          activeMessageId: response.id,
          activeMessage: response,
        }));
      });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "ArrowLeft"],
    () => {
      invoke("switch_active_message_version", {
        nodeId: node().id,
        versionNumber: node().activeMessage?.versionNumber! - 1,
      }).then((response) => {
        console.log(response);
        chatContext.updateNode(node().id, (node) => ({
          ...node,
          activeMessageId: response.id,
          activeMessage: response,
        }));
      });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "R"],
    () => {
      const channel = new Channel();
      channel.onmessage = (event) => {
        const { nodeId, message, messageId } = event!.data || {};

        chatContext.updateNode(nodeId, (node) => ({
          ...node,
          activeMessageId: messageId,
          activeMessage: {
            ...node.activeMessage!,
            content: message,
            id: messageId,
            versionNumber: node.messageCount ?? 1,
          },
        }));
      };

      invoke("regenerate_message", {
        nodeId: node().id,
        channel: channel,
      }).then(() => {
        chatContext.updateNode(node().id, (node) => ({
          ...node,
          messageCount: (node.messageCount ?? 0) + 1,
        }));
      });
    },
    { preventDefault: true, requireReset: false }
  );
  return null;
}

function Content() {
  const chatContext = useContext(ChatContext);
  const chatSettings = useChatSettings();
  const promptMode = createMemo(() => chatSettings.prompt().mode);

  return (
    <>
      <Show when={chatContext.state.nodes.length > 0}>
        <Nodes />
      </Show>
      <Show when={promptMode() === "floating"}>
        <Prompter />
      </Show>
    </>
  );
}

function Nodes() {
  const chatContext = useContext(ChatContext);

  let virtualListRef!: VListHandle;

  onMount(() => {
    setTimeout(() => {
      virtualListRef?.scrollToIndex(chatContext.state.nodes.length, {
        align: "end",
      });
    }, 0);
  });

  createEffect(() => {
    if (chatContext.state.isGenerating) {
      virtualListRef?.scrollToIndex(chatContext.state.nodes.length, {
        align: "end",
        offset: 150,
      });
    }
  });

  return (
    <VList
      ref={(h) => {
        virtualListRef = h!;
      }}
      class="size-full scrollbar-app px-24px mx-auto"
      data={[...chatContext.state.nodes, "FOOTER" as const]}
      overscan={10}
    >
      {(node, index) =>
        node === "FOOTER" ? (
          <Footer />
        ) : (
          <NodeWrapper node={node} index={index} />
        )
      }
    </VList>
  );
}

function Footer() {
  const chatContext = useContext(ChatContext);
  const chatSettings = useChatSettings();
  const promptMode = createMemo(() => chatSettings.prompt().mode);

  const node = createMemo(() => {
    return chatContext.state.nodes[chatContext.state.nodes.length - 1];
  });

  return (
    <div
      classList={{
        "h-200px": promptMode() === "floating",
        "py-24px": promptMode() !== "floating",
      }}
    >
      <div
        class="flex items-center gap-8px mt-10px absolute top-0px left-0 right-0 mx-auto inset-x-0 bg-elements-background w-auto w-max
        rounded-default py-8px px-16px
        text-ui
        "
      >
        <button
          disabled={node().activeMessage?.versionNumber! <= 1}
          class="disabled:opacity-50 disabled:cursor-default"
          onClick={() => {
            invoke("switch_active_message_version", {
              nodeId: node().id,
              versionNumber: node().activeMessage?.versionNumber! - 1,
            }).then((response) => {
              console.log(response);
              chatContext.updateNode(node().id, (node) => ({
                ...node,
                activeMessageId: response.id,
                activeMessage: response,
              }));
            });
          }}
        >
          <div class="i-lucide:arrow-left" />
        </button>
        {node().activeMessage?.versionNumber} / {node().messageCount}
        <button
          class="disabled:opacity-50 disabled:cursor-default"
          disabled={
            node().activeMessage?.versionNumber! >= node().messageCount!
          }
          onClick={() => {
            invoke("switch_active_message_version", {
              nodeId: node().id,
              versionNumber: node().activeMessage?.versionNumber! + 1,
            }).then((response) => {
              console.log(response);
              chatContext.updateNode(node().id, (node) => ({
                ...node,
                activeMessageId: response.id,
                activeMessage: response,
              }));
            });
          }}
        >
          <div class="i-lucide:arrow-right" />
        </button>
        <div class="w-1px h-10px bg-[#323535] mx-8px" />
        <button
          class="flex items-center gap-2px"
          onClick={() => {
            const channel = new Channel();
            channel.onmessage = (event) => {
              const { nodeId, message, messageId } = event!.data || {};

              chatContext.updateNode(nodeId, (node) => ({
                ...node,
                activeMessageId: messageId,
                activeMessage: {
                  ...node.activeMessage!,
                  content: message,
                  id: messageId,
                  versionNumber: node.messageCount ?? 1,
                },
              }));
            };

            invoke("regenerate_message", {
              nodeId: node().id,
              channel: channel,
            }).then(() => {
              chatContext.updateNode(node().id, (node) => ({
                ...node,
                messageCount: (node.messageCount ?? 0) + 1,
              }));
            });
          }}
        >
          <div class="i-lucide:refresh-cw text-ui-icon-small" />
        </button>
      </div>
      <Show when={promptMode() !== "floating"}>
        <Prompter />
      </Show>
    </div>
  );
}

function NodeWrapper({
  node,
}: {
  node: ChatNode;

  index: number;
}) {
  return (
    <div class="py-12px mx-auto max-w-960px">
      <Switch>
        <Match when={node.nodeType === "user_message"}>
          <UserNode node={node} />
        </Match>
        <Match when={node.nodeType === "assistant_message"}>
          <AssistantNode node={node} />
        </Match>
      </Switch>
    </div>
  );
}

function AssistantNode({ node }: { node: ChatNode }) {
  const chatContext = useContext(ChatContext);

  const messagesCount = createMemo(() => node.messageCount);

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
      <AssistantNodeContent node={node} />
    </Card>
  );
}

function AssistantNodeContent({ node }: { node: ChatNode }) {
  const contentDiv = document.createElement("div");
  contentDiv.className =
    "prose select-text cursor-auto w-full relative selection:bg-accent/15 max-w-800px";
  contentDiv.innerHTML = node.activeMessage?.content || "";

  const preElements = contentDiv.getElementsByTagName("pre");

  Array.from(preElements).forEach((pre) => {
    const wrapper = document.createElement("div");

    // Create toolbar elements imperatively to avoid mixing JSX and direct DOM manipulation causing type errors
    const toolbarDiv = document.createElement("div");
    toolbarDiv.className =
      "flex items-center justify-between px-10px h-38px sticky top-5px";
    const emptyDiv = document.createElement("div");
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "flex items-center gap-2px";
    const copyButton = document.createElement("button");
    copyButton.className =
      "size-22px rounded-4px flex items-center justify-center cursor-default hover:scale-110 transition-all active:scale-105 transition-duration-300 hover:text-white";
    const copyIcon = document.createElement("div");
    copyIcon.className = "i-lucide:copy text-ui-icon"; // Assuming UnoCSS handles this class
    copyButton.appendChild(copyIcon);
    buttonsDiv.appendChild(copyButton);
    toolbarDiv.appendChild(emptyDiv);
    toolbarDiv.appendChild(buttonsDiv);

    wrapper.className = "relative rounded-12px bg-elements-background";
    pre.style.background = "none";
    pre.style.padding = "0 20px 20px 20px";
    pre.style.margin = "0";
    pre.classList.add("scrollbar-app");

    wrapper.appendChild(toolbarDiv);
    wrapper.appendChild(pre.cloneNode(true));
    pre.parentNode?.replaceChild(wrapper, pre);
  });

  return <div class="px-12px">{contentDiv}</div>;
}

function UserNode({ node }: { node: ChatNode }) {
  return (
    <Card class="ml-auto">
      <div
        class="prose select-text cursor-auto relative selection:bg-accent/15"
        innerHTML={node.activeMessage?.content}
      />
    </Card>
  );
}

function Prompter() {
  const chatContext = useContext(ChatContext);
  const [message, setMessage] = createSignal("");
  const [isFocused, setIsFocused] = createSignal(false);

  const chatSettings = useChatSettings();
  const promptMode = createMemo(() => chatSettings.prompt().mode);

  const branch = useChatBranch({
    branchId: () => chatContext.state.branchId,
  });

  createShortcut(
    ["Meta", "Enter"],
    () => {
      onSubmit();
    },
    { preventDefault: true, requireReset: false }
  );

  const onSubmit = async () => {
    if (message().trim() === "") return;
    await chatContext.sendMessage(message().trim()).then(() => {
      setMessage("");
    });
  };

  return (
    <div
      classList={{
        absolute: promptMode() === "floating",
        "border-elements-background-soft shadow-elements-background-soft/15":
          isFocused(),
        "border-transparent": !isFocused(),
      }}
      class="border-2px transition-all duration-500 bottom-24px px-14px py-16px gap-3px inset-x-0 mx-auto flex flex-col justify-between backdrop-blur-88px bg-elements-background/70 rounded-22px shadow-2xl shadow-[#000]/15 max-w-700px"
    >
      <TextField
        value={message()}
        onChange={setMessage}
        onFocusIn={() => setIsFocused(true)}
        onFocusOut={() => setIsFocused(false)}
      >
        <TextField.TextArea
          placeholder="Ask me anything..."
          class="bg-transparent outline-none resize-none w-full text-sm max-h-200px scrollbar-app"
          autoResize
        />
      </TextField>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2px">
          <button
            class="text-muted text-13px size-24px hover:bg-elements-background-soft flex items-center justify-center rounded-8px"
            onClick={() => {
              openDialog({
                id: "chat-model-selection",
                payload: {
                  branchId: chatContext.state.branchId,
                },
              });
            }}
          >
            <div class="i-lucide:brain" />
          </button>

          <button
            class="text-muted text-13px size-24px hover:bg-elements-background-soft flex items-center justify-center rounded-8px"
            onClick={() => {
              openDialog({
                id: "chat-system-prompt-dialog",
                payload: {
                  branchId: chatContext.state.branchId,
                },
              });
            }}
          >
            <div class="i-lucide:bot" />
          </button>
        </div>
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
                        promptMode() === "floating" ? "docked" : "floating"
                      )
                    }
                  >
                    {promptMode() === "floating"
                      ? "Switch to Docked"
                      : "Switch to Floating"}
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
  );
}
