import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTree } from "@headless-tree/react";
import { asyncDataLoaderFeature, selectionFeature, hotkeysCoreFeature } from "@headless-tree/core";
import type { ItemInstance } from "@headless-tree/core";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Chat01Icon,
  Folder01Icon,
  Folder02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Tree, TreeItem, TreeItemIcon, TreeItemLabel } from "@/components/ui/tree";
import { chatTreeApi } from "@/api/chat-tree";
import { cn } from "@/lib/utils";
import { useSetChatTreeUiState } from "@/mutations/chat-tree";
import { getChatTreeUiStateQueryOptions } from "@/queries/chat-tree";
import type { ChatInfo, ChatTreeFolderListItem } from "../../../shared/ipc";

type ChatTreeNodeData =
  | { kind: "folder"; folder: ChatTreeFolderListItem }
  | { kind: "chat"; chat: ChatInfo }
  | { kind: "root" }
  | { kind: "loading" };

const ROOT_ITEM_ID = "root";

interface ChatSidebarTreeProps {
  workspaceId: string | null;
}

export function ChatSidebarTree({ workspaceId }: ChatSidebarTreeProps) {
  const uiStateQuery = useQuery(getChatTreeUiStateQueryOptions(workspaceId));

  return (
    <Sidebar collapsible="none">
      <SidebarContent className="gap-1 p-2">
        {!workspaceId ? (
          <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">Select a workspace.</p>
        ) : uiStateQuery.isPending ? (
          <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">Loading tree…</p>
        ) : uiStateQuery.isError ? (
          <div className="space-y-2 rounded-lg border border-sidebar-border p-2">
            <p className="text-sidebar-foreground/70 text-xs">
              {uiStateQuery.error instanceof Error
                ? uiStateQuery.error.message
                : "Failed to load tree state"}
            </p>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                void uiStateQuery.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <ChatSidebarTreeInner
            key={workspaceId}
            workspaceId={workspaceId}
            initialExpandedFolderIds={uiStateQuery.data.expandedFolderIds}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function ChatSidebarTreeInner({
  workspaceId,
  initialExpandedFolderIds,
}: {
  workspaceId: string;
  initialExpandedFolderIds: string[];
}) {
  const setChatTreeUiState = useSetChatTreeUiState();

  const [expandedItems, setExpandedItems] = React.useState<string[]>(() =>
    initialExpandedFolderIds.map((id) => `folder:${id}`),
  );

  const expandedItemsEvent = React.useEffectEvent((newExpandedItems: string[]) => {
    const folderIds = newExpandedItems
      .filter((id) => id.startsWith("folder:"))
      .map((id) => id.slice("folder:".length));
    setChatTreeUiState.mutate({
      workspaceId,
      expandedFolderIds: folderIds,
    });
  });

  React.useEffect(() => {
    expandedItemsEvent(expandedItems);
  }, [expandedItems]);

  const tree = useTree<ChatTreeNodeData>({
    rootItemId: ROOT_ITEM_ID,
    features: [asyncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
    state: { expandedItems },
    setExpandedItems,
    isItemFolder: (item) => {
      const id = item.getId();
      return id === ROOT_ITEM_ID || id.startsWith("folder:");
    },
    getItemName: (item) => {
      const data = item.getItemData();
      if (data.kind === "folder") return data.folder.name;
      if (data.kind === "chat") return data.chat.title;
      if (data.kind === "loading") return "Loading…";

      return "";
    },
    createLoadingItemData: () => ({ kind: "loading" as const }),
    dataLoader: {
      getItem: (itemId) => {
        if (itemId === ROOT_ITEM_ID) return { kind: "root" as const };
        return { kind: "loading" as const };
      },
      getChildrenWithData: async (itemId) => {
        const parentFolderId = itemId === ROOT_ITEM_ID ? null : itemId.slice("folder:".length);
        const slice = await chatTreeApi.getChildren(workspaceId, parentFolderId);
        return [
          ...slice.folders.map((folder) => ({
            id: `folder:${folder.id}`,
            data: { kind: "folder" as const, folder },
          })),
          ...slice.chats.map((chat) => ({
            id: `chat:${chat.id}`,
            data: { kind: "chat" as const, chat },
          })),
        ];
      },
    },
  });

  const items = tree.getItems();
  const visibleItems = items.filter((item) => item.getId() !== ROOT_ITEM_ID);

  if (visibleItems.length === 0) {
    return <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">No chats or folders yet.</p>;
  }

  return (
    <Tree className="gap-0.5" {...tree.getContainerProps("Chat tree")}>
      {visibleItems.map((item) => {
        const data = item.getItemData();
        const depth = getItemDepth(item);

        if (data.kind === "loading" || !item.hasLoadedData()) {
          return null;
        }

        if (data.kind === "chat") {
          return (
            <TreeItem
              key={item.getKey()}
              level={depth}
              {...item.getProps()}
              data-selected={item.isSelected() || undefined}
            >
              <TreeItemIcon className="text-muted-foreground">
                <HugeiconsIcon icon={Chat01Icon} />
              </TreeItemIcon>
              <TreeItemLabel>{data.chat.title}</TreeItemLabel>
            </TreeItem>
          );
        }

        if (data.kind === "folder") {
          const isExpanded = item.isExpanded();
          const hasChildren = data.folder.childFolderCount + data.folder.childChatCount > 0;

          return (
            <TreeItem
              key={item.getKey()}
              level={depth}
              {...item.getProps()}
              data-selected={item.isSelected() || undefined}
            >
              <TreeItemIcon className={cn("text-muted-foreground", !hasChildren && "opacity-50")}>
                <HugeiconsIcon icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon} />
              </TreeItemIcon>
              <TreeItemIcon className="text-muted-foreground">
                <HugeiconsIcon icon={isExpanded ? Folder02Icon : Folder01Icon} />
              </TreeItemIcon>
              <TreeItemLabel>{data.folder.name}</TreeItemLabel>
            </TreeItem>
          );
        }

        return null;
      })}
    </Tree>
  );
}

function getItemDepth(item: ItemInstance<ChatTreeNodeData>): number {
  let depth = 0;
  let current = item.getParent();
  while (current && current.getParent()) {
    depth++;
    current = current.getParent();
  }
  return depth;
}
