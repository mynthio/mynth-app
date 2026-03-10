import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Add01Icon,
  Cancel01Icon,
  CircleIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Setting07Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { getChatQueryOptions } from "@/queries/chats";
import { listWorkspacesQueryOptions } from "@/queries/workspaces";
import { useWorkspaceStore } from "../workspace/store";
import type { Tab } from "../workspace/store/types";

export function ChatToolbar() {
  const { data: workspaces = [] } = useQuery(listWorkspacesQueryOptions);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  const isSidebarOpen = isMobile ? openMobile : open;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2 w-full">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={toggleSidebar}
        >
          <HugeiconsIcon icon={isSidebarOpen ? PanelLeftCloseIcon : PanelLeftOpenIcon} />
        </Button>

        <Menu>
          <MenuTrigger
            render={<Button variant="secondary" size="sm" />}
            style={
              {
                "--from-color": workspace?.color,
              } as React.CSSProperties
            }
            className="border-none bg-linear-to-tr from-(--from-color) via-transparent to-transparent"
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

      <Button size="icon-sm" variant="ghost" render={<Link to="/settings" aria-label="Settings" />}>
        <HugeiconsIcon icon={Setting07Icon} />
      </Button>
    </div>
  );
}

function ChatTabsBar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  if (tabs.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto w-full">
      {tabs.map((tab) => (
        <ChatTabButton key={tab.id} tab={tab} />
      ))}
    </div>
  );
}

function ChatTabButton({ tab }: { tab: Tab }) {
  const chatQuery = useQuery(getChatQueryOptions(tab.type === "chat" ? tab.chatId : null));
  const title = chatQuery.data?.title ?? "New Tab";
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const activeId = useWorkspaceStore((s) => s.activeTabId);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  const isActive = React.useMemo(() => {
    return tab.id === activeId;
  }, [tab, activeId]);

  return (
    <Button
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
      className="group/tab relative z-0 w-full max-w-64 shrink px-4 justify-start text-left"
      onClick={() => {
        setActiveTab(tab.id);
      }}
    >
      {title}

      <button
        className="absolute right-0 z-10 flex aspect-square h-full cursor-pointer items-center justify-center overflow-hidden opacity-0 group-hover/tab:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          closeTab(tab.id);
        }}
      >
        <div className="flex size-5 items-center justify-center rounded-sm bg-black/70 backdrop-blur-lg">
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
        </div>
      </button>
    </Button>
  );
}
