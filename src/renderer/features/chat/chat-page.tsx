import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebarTree } from "@/features/chat/chat-sidebar-tree";
import { ChatTabHotkeys } from "@/features/chat/chat-tab-hotkeys";
import {
  ChatContextProvider,
  useChatIsBusy,
  useChatIsStreaming,
  useChatMessages,
  useChatModelId,
  useChatSendMessage,
  useSetChatModelId,
} from "@/features/chat/chat-context";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { getProviderIconById } from "@/lib/provider-icons";
import { cn } from "@/lib/utils";
import { listEnabledModelsQueryOptions } from "@/queries/models";
import { listProvidersQueryOptions } from "@/queries/providers";
import { globalChatSettingsQueryOptions } from "@/queries/settings";
import {
  useSystemStore,
  selectAiServerPort,
  selectAiServerReady,
} from "@/stores/system-store";
import { useWorkspaceStore } from "../workspace/store";
import { Conversation } from "./conversation";

export function ChatPage() {
  const activeTab = useWorkspaceStore((s) => s.activeTab());

  return (
    <SidebarProvider className="h-full min-h-0 w-full">
      <ChatTabHotkeys />
      <ChatSidebarTree />

      <div className="w-full h-[calc(100%-8px)] bg-card rounded-l-2xl overflow-hidden flex flex-col">
        {activeTab?.type === "chat" && activeTab.chatId ? (
          <ActiveChatView chatId={activeTab.chatId} />
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
            <p className="text-muted-foreground">
              No chat selected. Open a chat from the sidebar.
            </p>
            <Link
              to="/settings"
              className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Settings
            </Link>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}

function ActiveChatView({ chatId }: { chatId: string }) {
  const serverStatus = useSystemStore((s) => s.aiServer.status);
  const serverError = useSystemStore((s) => s.aiServer.error);
  const port = useSystemStore(selectAiServerPort);
  const isReady = useSystemStore(selectAiServerReady);

  const { data: enabledModels = [] } = useQuery(listEnabledModelsQueryOptions);
  const enabledModelIds = React.useMemo(
    () => enabledModels.map((model) => model.id),
    [enabledModels],
  );
  const apiUrl = port ? `http://127.0.0.1:${port}/api/chat` : "";

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
        <p className="text-sm text-destructive">
          AI server failed to start: {serverError}
        </p>
      </div>
    );
  }

  if (!isReady || enabledModels.length === 0) {
    return (
      <div className="flex-1 mx-auto flex w-full max-w-4xl flex-col px-6 py-6">
        <p className="text-sm text-muted-foreground">
          {enabledModels.length === 0
            ? "Enable a model in Settings to start chatting."
            : ""}
        </p>
      </div>
    );
  }

  return (
    <ChatContextProvider
      key={chatId}
      chatId={chatId}
      apiUrl={apiUrl}
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
  const isBusy = useChatIsBusy();
  const isStreaming = useChatIsStreaming();
  const { containerRef, anchorRef } = useScrollToBottom(isStreaming);
  const { data: globalChatSettings } = useQuery(globalChatSettingsQueryOptions);

  const promptStickyPosition = globalChatSettings?.promptStickyPosition ?? true;
  const submitBehavior = globalChatSettings?.formSubmitBehavior ?? "enter";

  const submitMessage = React.useCallback(() => {
    if (!modelId || !input.trim() || isBusy) {
      return false;
    }

    void sendMessage({
      text: input,
      metadata: {
        parentId: messages.at(-1)?.id ?? null,
      },
    });
    setInput("");
    return true;
  }, [input, isBusy, messages, modelId, sendMessage]);

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
      enabled: !isBusy,
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
      enabled: !isBusy,
      ignoreInputs: false,
      preventDefault: false,
      stopPropagation: false,
      requireReset: true,
    },
  );

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-auto scrollbar">
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
                disabled={isBusy}
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
                        disabled={!modelId || !input.trim() || isBusy}
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
  const modelId = useChatModelId();
  const setModelId = useSetChatModelId();
  const selectedModel = React.useMemo(
    () => enabledModels.find((candidate) => candidate.id === modelId) ?? null,
    [enabledModels, modelId],
  );
  const selectedProvider = React.useMemo(
    () =>
      selectedModel
        ? (providers.find(
            (provider) => provider.id === selectedModel.providerId,
          ) ?? null)
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
                />
              }
            />
          }
        >
          <span className="inline-flex text-foreground/60 overflow-hidden items-center gap-2">
            {SelectedProviderIcon ? (
              <SelectedProviderIcon className="size-4" />
            ) : null}
            <span className="truncate">
              {selectedModel?.displayName ??
                selectedModel?.providerModelId ??
                "Select model"}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipPopup>Select model</TooltipPopup>
      </Tooltip>
      <MenuPopup align="start">
        <MenuRadioGroup
          value={modelId ?? ""}
          onValueChange={(value) => setModelId(value || null)}
        >
          {enabledModels.map((m) => {
            const provider = providers.find(
              (candidate) => candidate.id === m.providerId,
            );
            const ProviderIcon = provider
              ? getProviderIconById(provider.catalogId)
              : null;

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
