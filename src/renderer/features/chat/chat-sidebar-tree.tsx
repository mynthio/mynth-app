import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTree } from "@headless-tree/react";
import {
  asyncDataLoaderFeature,
  selectionFeature,
  hotkeysCoreFeature,
  renamingFeature,
  dragAndDropFeature,
} from "@headless-tree/core";
import type { ItemInstance } from "@headless-tree/core";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Chat01Icon,
  FolderAddIcon,
  Folder01Icon,
  Folder02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemIcon,
  TreeItemLabel,
  TreeItemRenameInput,
} from "@/components/ui/tree";
import { chatTreeApi } from "@/api/chat-tree";
import { cn } from "@/lib/utils";
import {
  useSetChatTreeUiState,
  useSetChatTabsUiState,
  useRenameChatTreeItem,
  useMoveFolder,
  useMoveChat,
} from "@/mutations/chat-tree";
import { useCreateChat } from "@/mutations/chats";
import { useCreateFolder } from "@/mutations/folders";
import { DeleteChatDialog } from "@/features/chat/delete-chat-dialog";
import { DeleteFolderDialog } from "@/features/chat/delete-folder-dialog";
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
  const navigate = useNavigate();
  const { deleteChat, deleteFolder } = useSearch({ from: "/chat/" });
  const setChatTreeUiState = useSetChatTreeUiState();
  const setChatTabsUiState = useSetChatTabsUiState();
  const renameChatTreeItem = useRenameChatTreeItem();
  const moveFolderMutation = useMoveFolder();
  const moveChatMutation = useMoveChat();
  const createChatMutation = useCreateChat();
  const createFolderMutation = useCreateFolder();

  const [expandedItems, setExpandedItems] = React.useState<string[]>(() =>
    initialExpandedFolderIds.map((id) => `folder:${id}`),
  );
  const [renamingItem, setRenamingItemRaw] = React.useState<string | null | undefined>(null);
  const [renamingValue, setRenamingValueRaw] = React.useState<string | undefined>("");

  const setRenamingItem = React.useCallback(
    (
      updater:
        | string
        | null
        | undefined
        | ((old: string | null | undefined) => string | null | undefined),
    ) => {
      setRenamingItemRaw((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    [],
  );

  const setRenamingValue = React.useCallback(
    (updater: string | undefined | ((old: string | undefined) => string | undefined)) => {
      setRenamingValueRaw((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    [],
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
    features: [
      asyncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      renamingFeature,
      dragAndDropFeature,
    ],
    state: { expandedItems, renamingItem, renamingValue },
    setExpandedItems,
    setRenamingItem,
    setRenamingValue,
    canReorder: false,
    canDrop: (items, target) => {
      const targetId = target.item.getId();
      // Only allow dropping on folders or root
      if (targetId !== ROOT_ITEM_ID && !targetId.startsWith("folder:")) {
        return false;
      }
      // Prevent dropping a folder into itself or its descendants
      for (const item of items) {
        if (item.getId() === targetId) return false;
        let parent = target.item.getParent();
        while (parent) {
          if (parent.getId() === item.getId()) return false;
          parent = parent.getParent();
        }
      }
      return true;
    },
    onDrop: async (items, target) => {
      const targetId = target.item.getId();
      const targetFolderId = targetId === ROOT_ITEM_ID ? null : targetId.slice("folder:".length);

      for (const item of items) {
        const itemId = item.getId();
        if (itemId.startsWith("folder:")) {
          await moveFolderMutation.mutateAsync({
            id: itemId.slice("folder:".length),
            parentId: targetFolderId,
          });
        } else if (itemId.startsWith("chat:")) {
          await moveChatMutation.mutateAsync({
            id: itemId.slice("chat:".length),
            folderId: targetFolderId,
          });
        }
      }

      // Invalidate caches for old parents and new target
      for (const item of items) {
        item.getParent()?.invalidateChildrenIds();
      }
      target.item.invalidateChildrenIds();
      tree.rebuildTree();
    },
    onRename: (item, value) => {
      const itemId = item.getId();
      renameChatTreeItem.mutate(
        { itemId, name: value },
        {
          onSuccess: () => {
            void item.getParent()?.invalidateChildrenIds();
          },
        },
      );
    },
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

  const invalidateTree = React.useCallback(() => {
    void tree.getRootItem().invalidateChildrenIds();
    for (const item of tree.getItems()) {
      if (item.isFolder()) {
        void item.invalidateChildrenIds();
      }
    }
  }, [tree]);

  const createChat = React.useCallback(
    async (folderId: string | null) => {
      await createChatMutation.mutateAsync({
        workspaceId,
        title: "New chat",
        folderId,
      });
      invalidateTree();
    },
    [createChatMutation, invalidateTree, workspaceId],
  );

  const createFolder = React.useCallback(
    async (parentId: string | null) => {
      const folder = await createFolderMutation.mutateAsync({
        workspaceId,
        name: "New Folder",
        parentId,
      });
      setRenamingItem(`folder:${folder.id}`);
      setRenamingValue("New Folder");
      invalidateTree();
    },
    [createFolderMutation, invalidateTree, setRenamingItem, setRenamingValue, workspaceId],
  );

  const openChatInSingleTab = React.useCallback(
    (chatId: string) => {
      setChatTabsUiState.mutate({
        workspaceId,
        tabs: [{ chatId }],
      });

      void navigate({
        to: "/chat",
        search: (prev) => ({
          ...prev,
          deleteChat: undefined,
          deleteFolder: undefined,
          tabChatId: chatId,
        }),
      });
    },
    [navigate, setChatTabsUiState, workspaceId],
  );

  return (
    <>
      <div className="flex items-center gap-1 px-1 pb-1">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Add chat to root"
          onClick={() => {
            void createChat(null);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Add folder to root"
          onClick={() => {
            void createFolder(null);
          }}
        >
          <HugeiconsIcon icon={FolderAddIcon} />
        </Button>
      </div>
      {visibleItems.length === 0 ? (
        <p className="px-2 py-2 text-sidebar-foreground/70 text-xs">No chats or folders yet.</p>
      ) : (
        <Tree
          className="relative min-h-0 flex-1 gap-0.5 pb-8"
          {...tree.getContainerProps("Chat tree")}
        >
          <TreeDragLine style={tree.getDragLineStyle()} />
          {visibleItems.map((item) => {
            const data = item.getItemData();
            const depth = getItemDepth(item);

            if (data.kind === "loading" || !item.hasLoadedData()) {
              return null;
            }

            const handleContextMenu = (e: React.MouseEvent) => {
              e.preventDefault();
              const itemKind = data.kind === "folder" ? "folder" : "chat";
              void chatTreeApi.showContextMenu(item.getId(), itemKind).then((action) => {
                const ensureFolderExpanded = () => {
                  const folderItemId = item.getId();
                  setExpandedItems((prev) =>
                    prev.includes(folderItemId) ? prev : [...prev, folderItemId],
                  );
                };

                if (action === "add-folder" && itemKind === "folder") {
                  ensureFolderExpanded();
                  void createFolder(item.getId().slice("folder:".length));
                } else if (action === "add-chat" && itemKind === "folder") {
                  ensureFolderExpanded();
                  void createChat(item.getId().slice("folder:".length));
                } else if (action === "rename") {
                  item.startRenaming();
                } else if (action === "delete") {
                  const rawId = item.getId();
                  if (itemKind === "folder") {
                    void navigate({
                      to: "/chat",
                      search: { deleteFolder: rawId.slice("folder:".length) },
                    });
                  } else {
                    void navigate({
                      to: "/chat",
                      search: { deleteChat: rawId.slice("chat:".length) },
                    });
                  }
                }
              });
            };

            if (item.isRenaming()) {
              return (
                <TreeItem key={item.getKey()} level={depth} {...item.getProps()}>
                  {data.kind === "chat" ? (
                    <TreeItemIcon className="text-muted-foreground">
                      <HugeiconsIcon icon={Chat01Icon} />
                    </TreeItemIcon>
                  ) : data.kind === "folder" ? (
                    <>
                      <TreeItemIcon className="text-muted-foreground opacity-50">
                        <HugeiconsIcon icon={ArrowRight01Icon} />
                      </TreeItemIcon>
                      <TreeItemIcon className="text-muted-foreground">
                        <HugeiconsIcon icon={Folder01Icon} />
                      </TreeItemIcon>
                    </>
                  ) : null}
                  <TreeItemRenameInput {...item.getRenameInputProps()} />
                </TreeItem>
              );
            }

            if (data.kind === "chat") {
              return (
                <TreeItem
                  key={item.getKey()}
                  level={depth}
                  {...item.getProps()}
                  data-selected={item.isSelected() || undefined}
                  data-drop-target={item.isDragTarget() || undefined}
                  onClickCapture={() => {
                    openChatInSingleTab(data.chat.id);
                  }}
                  onContextMenu={handleContextMenu}
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
                  data-drop-target={item.isDragTarget() || undefined}
                  onContextMenu={handleContextMenu}
                >
                  <TreeItemIcon
                    className={cn("text-muted-foreground", !hasChildren && "opacity-50")}
                  >
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
      )}
      <DeleteChatDialog chatId={deleteChat} onSuccess={invalidateTree} />
      <DeleteFolderDialog folderId={deleteFolder} onSuccess={invalidateTree} />
    </>
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
