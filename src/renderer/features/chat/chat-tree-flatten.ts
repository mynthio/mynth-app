import type { ChatInfo, ChatTreeFolderListItem } from "../../../shared/ipc";
import type { WorkspaceChatTreeState } from "@/stores/chat-tree-store";
import { getChatTreeParentKey } from "@/stores/chat-tree-store";

export type ChatTreeRow =
  | {
      kind: "folder";
      key: string;
      level: number;
      folder: ChatTreeFolderListItem;
      hasChildren: boolean;
      isExpanded: boolean;
      isLoadingChildren: boolean;
      childLoadError: string | null;
    }
  | {
      kind: "chat";
      key: string;
      level: number;
      chat: ChatInfo;
    };

export function flattenChatTreeRows(
  workspaceTree: WorkspaceChatTreeState | undefined,
): ChatTreeRow[] {
  if (!workspaceTree) {
    return [];
  }

  const currentWorkspaceTree = workspaceTree;
  const rows: ChatTreeRow[] = [];
  const expandedFolderIds = new Set(currentWorkspaceTree.expandedFolderIds);

  function appendRowsForParent(parentFolderId: string | null, level: number): void {
    const slice = currentWorkspaceTree.childrenByParentKey[getChatTreeParentKey(parentFolderId)];
    if (!slice) {
      return;
    }

    for (const folder of slice.folders) {
      const hasChildren = folder.childFolderCount + folder.childChatCount > 0;
      const childParentKey = getChatTreeParentKey(folder.id);
      const isExpanded = expandedFolderIds.has(folder.id);

      rows.push({
        kind: "folder",
        key: `folder:${folder.id}`,
        level,
        folder,
        hasChildren,
        isExpanded,
        isLoadingChildren: currentWorkspaceTree.loadingParentKeys[childParentKey] ?? false,
        childLoadError: currentWorkspaceTree.errorByParentKey[childParentKey] ?? null,
      });

      if (hasChildren && isExpanded) {
        appendRowsForParent(folder.id, level + 1);
      }
    }

    for (const chat of slice.chats) {
      rows.push({
        kind: "chat",
        key: `chat:${chat.id}`,
        level,
        chat,
      });
    }
  }

  appendRowsForParent(null, 0);
  return rows;
}
