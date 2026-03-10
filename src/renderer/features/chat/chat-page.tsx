import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { chatsApi } from "@/api/chats";
import { Button } from "@/components/ui/button";
import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "@/components/ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import {
  ChatContextProvider,
  useChatIsInteractionLocked,
  useChatIsStreaming,
  useChatMessages,
  useChatModelId,
  useChatSendMessage,
  useSetChatModelId,
} from "@/features/chat/chat-context";
import { ChatScrollToBottomProvider } from "@/features/chat/chat-scroll-context";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { getProviderIconById } from "@/lib/provider-icons";
import { cn } from "@/lib/utils";
import { listEnabledModelsQueryOptions } from "@/queries/models";
import { listProvidersQueryOptions } from "@/queries/providers";
import { globalChatSettingsQueryOptions } from "@/queries/settings";
import { useSystemStore, selectAiServerPort, selectAiServerReady } from "@/stores/system-store";
import { ChatMessageHotkeys } from "./chat-message-hotkeys";
import { useWorkspaceStore } from "../workspace/store";
import { Conversation } from "./conversation";

export function ChatPage() {
  const activeTab = useWorkspaceStore((s) => s.activeTab());

  if (activeTab?.type === "chat" && activeTab.chatId) {
    return <ActiveChatView chatId={activeTab.chatId} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <p className="text-muted-foreground">No chat selected. Open a chat from the sidebar.</p>
    </div>
  );
}

function ActiveChatView({ chatId }: { chatId: string }) {
  const serverStatus = useSystemStore((s) => s.aiServer.status);
  const serverError = useSystemStore((s) => s.aiServer.error);
  const port = useSystemStore(selectAiServerPort);
  const isReady = useSystemStore(selectAiServerReady);
  const [initialModelId, setInitialModelId] = React.useState<string | null>(null);
  const [isChatLoaded, setIsChatLoaded] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);

  const { data: enabledModels = [] } = useQuery(listEnabledModelsQueryOptions);
  const enabledModelIds = React.useMemo(
    () => enabledModels.map((model) => model.id),
    [enabledModels],
  );
  const apiUrl = port ? `http://127.0.0.1:${port}/api/chat` : "";

  React.useEffect(() => {
    let isDisposed = false;

    setInitialModelId(null);
    setIsChatLoaded(false);
    setChatError(null);

    void chatsApi
      .get(chatId)
      .then((chat) => {
        if (isDisposed) {
          return;
        }

        setInitialModelId(chat.settings.modelId ?? null);
        setIsChatLoaded(true);
      })
      .catch((loadError) => {
        if (isDisposed) {
          return;
        }

        setChatError(
          loadError instanceof Error && loadError.message.trim()
            ? loadError.message
            : "Failed to load chat.",
        );
      });

    return () => {
      isDisposed = true;
    };
  }, [chatId]);

  if (serverStatus === "starting" || serverStatus === "idle") {
    return (
      <div className="flex-1 mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6">
        <p className="text-sm text-muted-foreground">AI server starting…</p>
      </div>
    );
  }

  if (serverStatus === "error") {
    return (
      <div className="flex-1 mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6">
        <p className="text-sm text-destructive">AI server failed to start: {serverError}</p>
      </div>
    );
  }

  if (!isReady || enabledModels.length === 0) {
    return (
      <div className="flex-1 mx-auto flex w-full max-w-4xl flex-col px-6 py-6">
        <p className="text-sm text-muted-foreground">
          {enabledModels.length === 0 ? "Enable a model in Settings to start chatting." : ""}
        </p>
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="flex-1 mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6">
        <p className="text-sm text-destructive">{chatError}</p>
      </div>
    );
  }

  if (!isChatLoaded) {
    return (
      <div className="flex-1 mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6">
        <p className="text-sm text-muted-foreground">Loading chat…</p>
      </div>
    );
  }

  return (
    <ChatContextProvider
      key={chatId}
      chatId={chatId}
      apiUrl={apiUrl}
      initialModelId={initialModelId}
      enabledModelIds={enabledModelIds}
    >
      <ActiveChatContent />
    </ChatContextProvider>
  );
}

function ActiveChatContent() {
  const [input, setInput] = React.useState("");
  const modelId = useChatModelId();
  const messages = useChatMessages();
  const sendMessage = useChatSendMessage();
  const isInteractionLocked = useChatIsInteractionLocked();
  const isStreaming = useChatIsStreaming();
  const { containerRef, anchorRef, scrollToBottom } = useScrollToBottom(isStreaming);
  const { data: globalChatSettings } = useQuery(globalChatSettingsQueryOptions);

  const promptStickyPosition = globalChatSettings?.promptStickyPosition ?? true;
  const submitBehavior = globalChatSettings?.formSubmitBehavior ?? "enter";

  const submitMessage = React.useCallback(() => {
    if (!modelId || !input.trim() || isInteractionLocked) {
      return false;
    }

    scrollToBottom();
    void sendMessage({
      text: input,
      metadata: {
        parentId: messages.at(-1)?.id ?? null,
      },
    });
    setInput("");
    return true;
  }, [input, isInteractionLocked, messages, modelId, scrollToBottom, sendMessage]);

  useHotkey(
    "Enter",
    (event) => {
      if (!isComposerInputEvent(event)) {
        return;
      }

      if (submitBehavior !== "enter" || event.isComposing) {
        return;
      }

      if (submitMessage()) {
        event.preventDefault();
      }
    },
    {
      enabled: !isInteractionLocked,
      ignoreInputs: false,
      preventDefault: false,
      stopPropagation: false,
      requireReset: true,
    },
  );

  useHotkey(
    {
      key: "Enter",
      mod: true,
    },
    (event) => {
      if (!isComposerInputEvent(event)) {
        return;
      }

      if (submitBehavior !== "mod-enter" || event.isComposing) {
        return;
      }

      if (submitMessage()) {
        event.preventDefault();
      }
    },
    {
      enabled: !isInteractionLocked,
      ignoreInputs: false,
      preventDefault: false,
      stopPropagation: false,
      requireReset: true,
    },
  );

  return (
    <ChatScrollToBottomProvider scrollToBottom={scrollToBottom}>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto scrollbar">
        <ChatMessageHotkeys />

        <div className="flex flex-col min-h-full justify-end">
          <Conversation />

          <div
            className={cn(
              "mt-24 mx-auto w-4xl max-w-[calc(100%-4rem)] mb-4",
              promptStickyPosition ? "sticky bottom-4" : null,
            )}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
            >
              <InputGroup
                className="dark:bg-background shadow-xl shadow-black/20 p-3"
                style={
                  {
                    "--radius-lg": "30px",
                    "--radius": "30px",
                  } as React.CSSProperties
                }
              >
                <InputGroupTextarea
                  data-chat-composer-input="true"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask, Search or Chat…"
                  disabled={isInteractionLocked}
                  rows={1}
                />
                <InputGroupAddon align="block-end" className="p-0">
                  <ModelSelector />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="submit"
                          aria-label="Send"
                          className="ml-auto"
                          size="icon-lg"
                          disabled={!modelId || !input.trim() || isInteractionLocked}
                        >
                          <HugeiconsIcon icon={ArrowUp01Icon} />
                        </Button>
                      }
                    />
                    <TooltipPopup>Send</TooltipPopup>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>

          <div ref={anchorRef} aria-hidden="true" />
        </div>
      </div>
    </ChatScrollToBottomProvider>
  );
}

function isComposerInputEvent(event: KeyboardEvent): boolean {
  if (!(event.target instanceof HTMLElement)) {
    return false;
  }

  return event.target.closest("[data-chat-composer-input='true']") !== null;
}

function ModelSelector() {
  const { data: enabledModels = [] } = useQuery(listEnabledModelsQueryOptions);
  const { data: providers = [] } = useQuery(listProvidersQueryOptions);
  const isInteractionLocked = useChatIsInteractionLocked();
  const modelId = useChatModelId();
  const setModelId = useSetChatModelId();
  const selectedModel = React.useMemo(
    () => enabledModels.find((candidate) => candidate.id === modelId) ?? null,
    [enabledModels, modelId],
  );
  const selectedProvider = React.useMemo(
    () =>
      selectedModel
        ? (providers.find((provider) => provider.id === selectedModel.providerId) ?? null)
        : null,
    [providers, selectedModel],
  );
  const SelectedProviderIcon = selectedProvider
    ? getProviderIconById(selectedProvider.catalogId)
    : null;

  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              openOnHover
              render={
                <Button
                  aria-label="Select model"
                  className="max-w-xl"
                  variant="ghost"
                  disabled={isInteractionLocked}
                />
              }
            />
          }
        >
          <span className="inline-flex text-foreground/60 overflow-hidden items-center gap-2">
            {SelectedProviderIcon ? <SelectedProviderIcon className="size-4" /> : null}
            <span className="truncate">
              {selectedModel?.displayName ?? selectedModel?.providerModelId ?? "Select model"}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipPopup>Select model</TooltipPopup>
      </Tooltip>
      <MenuPopup align="start">
        <MenuRadioGroup value={modelId ?? ""} onValueChange={(value) => setModelId(value || null)}>
          {enabledModels.map((m) => {
            const provider = providers.find((candidate) => candidate.id === m.providerId);
            const ProviderIcon = provider ? getProviderIconById(provider.catalogId) : null;

            return (
              <MenuRadioItem key={m.id} value={m.id}>
                <span className="inline-flex items-center gap-2">
                  {ProviderIcon ? <ProviderIcon className="size-4" /> : null}
                  <span>{m.displayName ?? m.providerModelId}</span>
                </span>
              </MenuRadioItem>
            );
          })}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
