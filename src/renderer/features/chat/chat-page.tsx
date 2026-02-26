import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Add01Icon, Setting07Icon } from "@hugeicons/core-free-icons";
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
import { WindowChrome } from "@/components/app/window-chrome";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebarTree } from "@/features/chat/chat-sidebar-tree";
import { useSetActiveWorkspace } from "@/mutations/workspaces";
import { chatsApi } from "@/api/chats";
import { getChatQueryOptions } from "@/queries/chats";
import { getChatTabsUiStateQueryOptions } from "@/queries/chat-tree";
import { listEnabledModelsQueryOptions } from "@/queries/models";
import { activeWorkspaceQueryOptions, listWorkspacesQueryOptions } from "@/queries/workspaces";
import { useSystemStore, selectAiServerPort, selectAiServerReady } from "@/stores/system-store";
import {
  chatMessageMetadataSchema,
  type MynthUiMessage,
} from "../../../shared/chat/message-metadata";
import type { ChatTabStateItem } from "../../../shared/ipc";

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
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const effectiveModelId = selectedModelId ?? enabledModels[0]?.id ?? null;
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
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 py-6">
      <div className="mb-3 flex items-center gap-2">
        <select
          value={effectiveModelId ?? ""}
          onChange={(e) => setSelectedModelId(e.target.value || null)}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={enabledModels.length === 0}
        >
          {enabledModels.length === 0 ? (
            <option value="">No models enabled</option>
          ) : (
            enabledModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName ?? m.providerModelId}
              </option>
            ))
          )}
        </select>
      </div>

      {isReady && effectiveModelId ? (
        <ActiveChatContent
          key={`${chatId}:${effectiveModelId}`}
          chatId={chatId}
          apiUrl={apiUrl}
          modelId={effectiveModelId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {enabledModels.length === 0 ? "Enable a model in Settings to start chatting." : ""}
        </p>
      )}
    </div>
  );
}

function ActiveChatContent({
  chatId,
  apiUrl,
  modelId,
}: {
  chatId: string;
  apiUrl: string;
  modelId: string;
}) {
  const [input, setInput] = useState("");
  const [historyError, setHistoryError] = useState<string | null>(null);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport<MynthUiMessage>({
        api: apiUrl,
        body: { modelId, chatId },
        prepareSendMessagesRequest: ({ body, trigger, messages, messageId }) => ({
          body: {
            ...body,
            messages,
            chatId,
            modelId,
            trigger,
            messageId,
          },
        }),
      }),
    [apiUrl, chatId, modelId],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat<MynthUiMessage>({
    id: chatId,
    transport,
    messageMetadataSchema: chatMessageMetadataSchema,
  });

  React.useEffect(() => {
    let isDisposed = false;

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
  }, [chatId, setMessages]);

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
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
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
          if (input.trim()) {
            void sendMessage({
              text: input,
              metadata: {
                parentId: messages.at(-1)?.id ?? null,
              },
            });
            setInput("");
          }
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={status === "streaming" || status === "submitted"}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || status === "streaming" || status === "submitted"}
        >
          Send
        </Button>
      </form>
    </>
  );
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
