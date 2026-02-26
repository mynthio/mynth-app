import * as React from "react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { Add01Icon, ArrowUp01Icon, Setting07Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { WindowChrome } from "@/components/app/window-chrome";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebarTree } from "@/features/chat/chat-sidebar-tree";
import { getProviderIconById } from "@/lib/provider-icons";
import { useSetActiveWorkspace } from "@/mutations/workspaces";
import { chatsApi } from "@/api/chats";
import { getChatQueryOptions } from "@/queries/chats";
import { getChatTabsUiStateQueryOptions } from "@/queries/chat-tree";
import { listEnabledModelsQueryOptions } from "@/queries/models";
import { listProvidersQueryOptions } from "@/queries/providers";
import { activeWorkspaceQueryOptions, listWorkspacesQueryOptions } from "@/queries/workspaces";
import { useSystemStore, selectAiServerPort, selectAiServerReady } from "@/stores/system-store";
import { useChatStore } from "@/stores/chat-store";
import type { MynthUiMessage } from "../../../shared/chat/message-metadata";
import type { ChatTabStateItem } from "../../../shared/ipc";

type ChatModelContextValue = {
  modelId: string | null;
  setModelId: React.Dispatch<React.SetStateAction<string | null>>;
};

const ChatModelContext = React.createContext<ChatModelContextValue | null>(null);

export function ChatPage() {
  const { data: workspaces = [] } = useQuery(listWorkspacesQueryOptions);
  const { data: activeWorkspace } = useQuery(activeWorkspaceQueryOptions);
  const { tabChatId } = useSearch({ from: "/chat/" });
  const navigate = useNavigate();

  const setActiveWorkspace = useSetActiveWorkspace();
  const chatTabsQuery = useQuery(getChatTabsUiStateQueryOptions(activeWorkspace?.id ?? null));
  const tabs = chatTabsQuery.data?.tabs ?? [];
  const activeTabChatId = resolveActiveTabChatId(tabs, tabChatId);

  React.useEffect(() => {
    if (activeWorkspace?.id && chatTabsQuery.isPending) {
      return;
    }

    if ((tabChatId ?? null) === (activeTabChatId ?? null)) {
      return;
    }

    void navigate({
      to: "/chat",
      replace: true,
      search: (prev) => ({
        ...prev,
        tabChatId: activeTabChatId,
      }),
    });
  }, [activeTabChatId, activeWorkspace?.id, chatTabsQuery.isPending, navigate, tabChatId]);

  return (
    <WindowChrome
      toolbar={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Menu>
              <MenuTrigger
                render={<Button variant="secondary" size="sm" />}
                style={{ "--from-color": activeWorkspace?.color }}
                className={`bg-linear-to-tr from-(--from-color) via-transparent to-transparent border-none`}
              >
                {activeWorkspace?.name ?? "…"}
              </MenuTrigger>
              <MenuPopup align="start">
                <Button
                  className="w-full justify-start"
                  size="xs"
                  variant="ghost"
                  render={<Link to="/settings/workspaces/new" />}
                >
                  <HugeiconsIcon icon={Add01Icon} />
                  <span>Create Workspace</span>
                </Button>
                <MenuSeparator />
                <MenuRadioGroup
                  value={activeWorkspace?.id}
                  onValueChange={(workspaceId) => {
                    void setActiveWorkspace.mutateAsync(workspaceId);
                  }}
                >
                  {workspaces.map((ws) => (
                    <MenuRadioItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>

            <ChatTabsBar
              tabs={tabs}
              activeTabChatId={activeTabChatId ?? null}
              isLoading={Boolean(activeWorkspace?.id) && chatTabsQuery.isPending}
              isError={chatTabsQuery.isError}
              onSelectTab={(chatId) => {
                void navigate({
                  to: "/chat",
                  search: (prev) => ({
                    ...prev,
                    tabChatId: chatId,
                  }),
                });
              }}
            />
          </div>

          <Button
            size="icon-sm"
            variant="ghost"
            render={<Link to="/settings" aria-label="Settings" />}
          >
            <HugeiconsIcon icon={Setting07Icon} />
          </Button>
        </div>
      }
      contentClassName="overflow-hidden"
    >
      <SidebarProvider className="h-full min-h-0">
        <ChatSidebarTree workspaceId={activeWorkspace?.id ?? null} />
        <main className="min-h-0 flex-1 overflow-auto">
          {activeTabChatId ? (
            <ActiveChatView chatId={activeTabChatId} />
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
        </main>
      </SidebarProvider>
    </WindowChrome>
  );
}

function ChatTabsBar({
  tabs,
  activeTabChatId,
  isLoading,
  isError,
  onSelectTab,
}: {
  tabs: ChatTabStateItem[];
  activeTabChatId: string | null;
  isLoading: boolean;
  isError: boolean;
  onSelectTab: (chatId: string) => void;
}) {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading tabs…</p>;
  }

  if (isError) {
    return <p className="text-xs text-muted-foreground">Tabs unavailable</p>;
  }

  if (tabs.length === 0) {
    return <p className="text-xs text-muted-foreground">No tabs</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
      {tabs.map((tab, index) => (
        <ChatTabButton
          key={tab.chatId}
          tab={tab}
          index={index}
          isActive={tab.chatId === activeTabChatId}
          onSelect={onSelectTab}
        />
      ))}
    </div>
  );
}

function ChatTabButton({
  tab,
  index,
  isActive,
  onSelect,
}: {
  tab: ChatTabStateItem;
  index: number;
  isActive: boolean;
  onSelect: (chatId: string) => void;
}) {
  const chatQuery = useQuery(getChatQueryOptions(tab.chatId));
  const title = chatQuery.data?.title ?? "Chat";

  return (
    <Button
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
      className="shrink-0"
      onClick={() => {
        onSelect(tab.chatId);
      }}
    >
      {index + 1}. {title}
    </Button>
  );
}

function ActiveChatView({ chatId }: { chatId: string }) {
  const serverStatus = useSystemStore((s) => s.aiServer.status);
  const serverError = useSystemStore((s) => s.aiServer.error);
  const port = useSystemStore(selectAiServerPort);
  const isReady = useSystemStore(selectAiServerReady);

  const { data: enabledModels = [] } = useQuery(listEnabledModelsQueryOptions);
  const [modelId, setModelId] = useState<string | null>(null);
  const chatModelContextValue = React.useMemo<ChatModelContextValue>(
    () => ({
      modelId: modelId ?? enabledModels[0]?.id ?? null,
      setModelId,
    }),
    [enabledModels, modelId],
  );
  const apiUrl = port ? `http://127.0.0.1:${port}/api/chat` : "";

  if (serverStatus === "starting" || serverStatus === "idle") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6">
        <p className="text-sm text-muted-foreground">AI server starting…</p>
      </div>
    );
  }

  if (serverStatus === "error") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6">
        <p className="text-sm text-destructive">AI server failed to start: {serverError}</p>
      </div>
    );
  }

  return (
    <ChatModelContext.Provider value={chatModelContextValue}>
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 py-6">
        {isReady && chatModelContextValue.modelId ? (
          <ActiveChatContent
            key={chatId}
            chatId={chatId}
            apiUrl={apiUrl}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {enabledModels.length === 0 ? "Enable a model in Settings to start chatting." : ""}
          </p>
        )}
      </div>
    </ChatModelContext.Provider>
  );
}

function ActiveChatContent({ chatId, apiUrl }: { chatId: string; apiUrl: string }) {
  const [input, setInput] = useState("");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { modelId } = useChatModelContext();

  if (!modelId) {
    throw new Error("ActiveChatContent requires a selected model");
  }

  const getOrCreateChat = useChatStore((s) => s.getOrCreateChat);

  const chat = React.useMemo(
    () => getOrCreateChat(chatId, apiUrl),
    // apiUrl is stable once the server is ready (determined at mount time).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId],
  );

  const {
    messages,
    sendMessage: rawSendMessage,
    regenerate: rawRegenerate,
    setMessages,
    status,
    error,
  } = useChat<MynthUiMessage>({ chat });

  // Wrap send/regenerate to inject modelId (and any future per-request params)
  // as additional body, keeping the transport stable and free of React state.
  const sendMessage = React.useCallback(
    (
      message: Parameters<typeof rawSendMessage>[0],
      options?: Parameters<typeof rawSendMessage>[1],
    ) => rawSendMessage(message, { ...options, body: { ...options?.body, modelId } }),
    [rawSendMessage, modelId],
  );

  const regenerate = React.useCallback(
    (options?: Parameters<typeof rawRegenerate>[0]) =>
      rawRegenerate({ ...options, body: { ...options?.body, modelId } }),
    [rawRegenerate, modelId],
  );

  React.useEffect(() => {
    let isDisposed = false;

    // If the Chat already has messages (e.g. returning to a tab that was
    // already loaded), skip re-loading so we don't lose streaming state.
    if (chat.messages.length > 0) return;

    setHistoryError(null);

    void chatsApi
      .listMessages(chatId)
      .then((persistedMessages) => {
        if (isDisposed) {
          return;
        }

        setMessages(persistedMessages);
      })
      .catch((loadError) => {
        if (isDisposed) {
          return;
        }

        const message =
          loadError instanceof Error && loadError.message.trim()
            ? loadError.message
            : "Failed to load chat messages.";
        setHistoryError(message);
      });

    return () => {
      isDisposed = true;
    };
  }, [chatId, chat, setMessages]);

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Send a message to start chatting.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    message.role === "user" ? (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    ) : (
                      <Streamdown key={i} animated>
                        {part.text}
                      </Streamdown>
                    )
                  ) : null,
                )}
              </div>
            </div>
          ))
        )}

        {historyError ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {historyError}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!modelId || !input.trim()) {
            return;
          }

          void sendMessage({
            text: input,
            metadata: {
              parentId: messages.at(-1)?.id ?? null,
            },
          });
          setInput("");
        }}
        className="mt-4"
      >
        <InputGroup>
          <InputGroupTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask, Search or Chat…"
            disabled={status === "streaming" || status === "submitted"}
            rows={1}
          />
          <InputGroupAddon align="block-end">
            <ModelSelector />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="submit"
                    aria-label="Send"
                    className="ml-auto rounded-full"
                    size="icon-sm"
                    variant="default"
                    disabled={
                      !modelId || !input.trim() || status === "streaming" || status === "submitted"
                    }
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
    </>
  );
}

function ModelSelector() {
  const { data: enabledModels = [] } = useQuery(listEnabledModelsQueryOptions);
  const { data: providers = [] } = useQuery(listProvidersQueryOptions);
  const { modelId, setModelId } = useChatModelContext();
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
              render={<Button aria-label="Select model" className="rounded-full" variant="ghost" />}
            />
          }
        >
          <span className="inline-flex items-center gap-2">
            {SelectedProviderIcon ? <SelectedProviderIcon className="size-4" /> : null}
            <span>
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

function useChatModelContext() {
  const context = React.useContext(ChatModelContext);

  if (!context) {
    throw new Error("ChatModelContext is not available");
  }

  return context;
}

function resolveActiveTabChatId(
  tabs: readonly ChatTabStateItem[],
  requestedChatId: string | undefined,
): string | undefined {
  if (requestedChatId && tabs.some((tab) => tab.chatId === requestedChatId)) {
    return requestedChatId;
  }

  return tabs[0]?.chatId;
}
