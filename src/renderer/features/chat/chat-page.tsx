import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
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
import { getChatQueryOptions } from "@/queries/chats";
import { getChatTabsUiStateQueryOptions } from "@/queries/chat-tree";
import { activeWorkspaceQueryOptions, listWorkspacesQueryOptions } from "@/queries/workspaces";
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
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
            {activeTabChatId ? (
              <p className="text-sm text-muted-foreground">Active tab chat: {activeTabChatId}</p>
            ) : null}
            <p className="text-muted-foreground">Chat interface coming soon.</p>
            <Link
              to="/settings"
              className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Settings
            </Link>
          </div>
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

function resolveActiveTabChatId(
  tabs: readonly ChatTabStateItem[],
  requestedChatId: string | undefined,
): string | undefined {
  if (requestedChatId && tabs.some((tab) => tab.chatId === requestedChatId)) {
    return requestedChatId;
  }

  return tabs[0]?.chatId;
}
