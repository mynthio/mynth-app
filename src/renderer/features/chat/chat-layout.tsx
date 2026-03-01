import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
import {
  Add01Icon,
  Cancel01Icon,
  CircleIcon,
  Setting07Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { WindowChrome } from "@/components/app/window-chrome";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";

import { getChatQueryOptions } from "@/queries/chats";
import { listWorkspacesQueryOptions } from "@/queries/workspaces";
import { useWorkspaceStore } from "../workspace/store";
import { Tab } from "../workspace/store/types";

export function ChatLayout() {
  return <ChatLayoutContent />;
}

function ChatLayoutContent() {
  const { data: workspaces = [] } = useQuery(listWorkspacesQueryOptions);
  const workspace = useWorkspaceStore((s) => s.workspace);

  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);

  // const hasHydrated = useWorkspaceStore.persist.hasHydrated();
  // console.log("Has Hydrated", hasHydrated);

  // if (!hasHydrated) return null;

  return (
    <WindowChrome
      toolbar={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Menu>
              <MenuTrigger
                render={<Button variant="secondary" size="sm" />}
                style={
                  {
                    "--from-color": workspace?.color,
                  } as React.CSSProperties
                }
                className={`bg-linear-to-tr from-(--from-color) via-transparent to-transparent border-none`}
              >
                {workspace?.name ?? "…"}
              </MenuTrigger>
              <MenuPopup align="start">
                {workspaces.map((ws) => (
                  <MenuItem
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                    }}
                  >
                    <HugeiconsIcon
                      icon={CircleIcon}
                      color={ws.color ?? "current"}
                      fill={ws.color ?? "current"}
                    />
                    {ws.name}
                  </MenuItem>
                ))}
                <MenuSeparator />
                <Button
                  className="w-full justify-start"
                  size="xs"
                  variant="ghost"
                  render={<Link to="/settings/workspaces/new" />}
                >
                  <HugeiconsIcon icon={Add01Icon} />
                  <span>Create Workspace</span>
                </Button>
              </MenuPopup>
            </Menu>

            <ChatTabsBar />
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
      <Outlet />
    </WindowChrome>
  );
}

function ChatTabsBar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  if (tabs.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <ChatTabButton key={tab.id} tab={tab} />
      ))}
    </div>
  );
}

function ChatTabButton({ tab }: { tab: Tab }) {
  const chatQuery = useQuery(getChatQueryOptions(tab.chatId));
  const title = chatQuery.data?.title ?? "Chat";

  const openTab = useWorkspaceStore((s) => s.openTab);
  const activeId = useWorkspaceStore((s) => s.activeTabId);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  const isActive = React.useMemo(() => {
    return tab.id === activeId;
  }, [tab, activeId]);

  return (
    <Button
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
      className="shrink-0 group/tab relative z-0 px-4 justify-start text-left"
      onClick={() => {
        openTab(tab.chatId);
      }}
    >
      {title}

      <button
        className="opacity-0 group-hover/tab:opacity-100 cursor-pointer absolute right-0 aspect-square h-full z-10 flex items-center justify-center overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          closeTab(tab.id);
        }}
      >
        <div className="bg-black/70 backdrop-blur-lg rounded-sm size-5 flex items-center justify-center">
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
        </div>
      </button>
    </Button>
  );
}
