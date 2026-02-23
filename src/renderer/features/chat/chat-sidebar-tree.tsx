"use client";

import * as React from "react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Chat01Icon,
  Folder01Icon,
  FolderOpenIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarSeparator } from "@/components/ui/sidebar";
import { Tree, TreeItem, TreeItemActions, TreeItemIcon, TreeItemLabel } from "@/components/ui/tree";
import { cn } from "@/lib/utils";
import { flattenChatTreeRows } from "@/features/chat/chat-tree-flatten";
import { getChatTreeParentKey, useChatTreeStore } from "@/stores/chat-tree-store";

interface ChatSidebarTreeProps {
  workspaceId: string | null;
  workspaceName: string | null;
}

export function ChatSidebarTree({ workspaceId, workspaceName }: ChatSidebarTreeProps) {
  const [selectedRowKey, setSelectedRowKey] = React.useState<string | null>(null);

  const ensureInitialized = useChatTreeStore((state) => state.ensureInitialized);
  const loadChildren = useChatTreeStore((state) => state.loadChildren);
  const toggleFolder = useChatTreeStore((state) => state.toggleFolder);
  const flushPersist = useChatTreeStore((state) => state.flushPersist);
  const workspaceTree = useChatTreeStore((state) =>
    workspaceId ? state.workspaces[workspaceId] : undefined,
  );

  React.useEffect(() => {
    if (!workspaceId) {
      return;
    }

    void ensureInitialized(workspaceId);
  }, [ensureInitialized, workspaceId]);

  React.useEffect(() => {
    setSelectedRowKey(null);
  }, [workspaceId]);

  React.useEffect(() => {
    if (!workspaceId) {
      return;
    }

    return () => {
      void flushPersist(workspaceId);
    };
  }, [flushPersist, workspaceId]);

  const rows = React.useMemo(() => flattenChatTreeRows(workspaceTree), [workspaceTree]);
  const rootParentKey = getChatTreeParentKey(null);
  const rootLoading = workspaceTree?.loadingParentKeys[rootParentKey] ?? false;
  const rootError = workspaceTree?.errorByParentKey[rootParentKey] ?? null;
  const hasLoadedRoot = Boolean(workspaceTree?.childrenByParentKey[rootParentKey]);
  const isInitializing = workspaceTree?.initializing ?? false;

  return (
    <Sidebar collapsible="none" className="border-r">
      <SidebarHeader>
        <div className="space-y-1 px-2 py-1">
          <p className="font-medium text-sm">Chats</p>
          <p className="truncate text-sidebar-foreground/70 text-xs">
            {workspaceName ?? "No workspace selected"}
          </p>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="gap-1 p-2">
        {!workspaceId ? (
          <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">Select a workspace.</p>
        ) : null}

        {workspaceId && rootError && !hasLoadedRoot ? (
          <div className="space-y-2 rounded-lg border border-sidebar-border p-2">
            <p className="text-sidebar-foreground/70 text-xs">{rootError}</p>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                void loadChildren(workspaceId, null);
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {workspaceId && (rootLoading || (isInitializing && !hasLoadedRoot)) ? (
          <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">Loading tree…</p>
        ) : null}

        {workspaceId && hasLoadedRoot && rows.length === 0 ? (
          <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">No chats or folders yet.</p>
        ) : null}

        {workspaceId && rows.length > 0 ? (
          <Tree className="gap-0.5">
            {rows.map((row) => {
              if (row.kind === "chat") {
                return (
                  <TreeItem
                    key={row.key}
                    level={row.level}
                    data-selected={selectedRowKey === row.key ? true : undefined}
                    onClick={() => {
                      setSelectedRowKey(row.key);
                    }}
                  >
                    <TreeItemIcon className="text-muted-foreground">
                      <HugeiconsIcon icon={Chat01Icon} />
                    </TreeItemIcon>
                    <TreeItemLabel>{row.chat.title}</TreeItemLabel>
                  </TreeItem>
                );
              }

              const icon = row.isExpanded ? FolderOpenIcon : Folder01Icon;

              return (
                <TreeItem
                  key={row.key}
                  level={row.level}
                  data-selected={selectedRowKey === row.key ? true : undefined}
                  onClick={() => {
                    setSelectedRowKey(row.key);

                    if (!row.hasChildren || !workspaceId) {
                      return;
                    }

                    void toggleFolder(workspaceId, row.folder.id);
                  }}
                >
                  <TreeItemIcon
                    className={cn("text-muted-foreground", !row.hasChildren && "opacity-50")}
                  >
                    <HugeiconsIcon icon={row.isExpanded ? ArrowDown01Icon : ArrowRight01Icon} />
                  </TreeItemIcon>
                  <TreeItemIcon className="text-muted-foreground">
                    <HugeiconsIcon icon={icon} />
                  </TreeItemIcon>
                  <TreeItemLabel>{row.folder.name}</TreeItemLabel>
                  {(row.isLoadingChildren || row.childLoadError) && (
                    <TreeItemActions>
                      {row.isLoadingChildren ? (
                        <span className="pr-1 text-muted-foreground text-xs">Loading…</span>
                      ) : null}
                      {row.childLoadError ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!workspaceId) {
                              return;
                            }

                            void loadChildren(workspaceId, row.folder.id);
                          }}
                        >
                          Retry
                        </Button>
                      ) : null}
                    </TreeItemActions>
                  )}
                </TreeItem>
              );
            })}
          </Tree>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}
