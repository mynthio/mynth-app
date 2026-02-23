import {
  createChat,
  createFolder,
  deleteChat,
  deleteFolderRecursive,
  getChatTreeChildren,
  getChatTree,
  listWorkspaceFolderIds,
  moveChat,
  moveFolder,
  updateChatTitle,
  updateFolderName,
  type ChatRow,
  type ChatTreeChildrenSlice as ChatTreeChildrenSliceRecord,
  type ChatTreeFolderListItem as ChatTreeFolderListItemRecord,
  type ChatTreeFolderNode as ChatTreeFolderNodeRecord,
  type ChatTreeSnapshot as ChatTreeSnapshotRecord,
  type FolderRow,
} from "../chat-tree/repository";
import { parseFolderId } from "../../shared/folder/folder-id";
import type {
  ChatInfo,
  ChatTreeChildrenSlice,
  ChatTreeFolderListItem,
  ChatTreeFolderNode,
  ChatTreeSnapshot,
  ChatTreeUiState,
  FolderInfo,
} from "../../shared/ipc";
import { getWorkspaceSettings, updateWorkspaceSettings } from "../workspaces/repository";

const CHAT_TREE_EXPANDED_FOLDER_IDS_SETTINGS_KEY = "chatTreeExpandedFolderIds";
const MAX_PERSISTED_EXPANDED_FOLDER_IDS = 2000;

export interface ChatTreeService {
  getChatTree(workspaceId: string): ChatTreeSnapshot;
  getChatTreeChildren(workspaceId: string, parentFolderId: string | null): ChatTreeChildrenSlice;
  getChatTreeUiState(workspaceId: string): ChatTreeUiState;
  setChatTreeUiState(workspaceId: string, expandedFolderIds: string[]): ChatTreeUiState;
  createFolder(input: { workspaceId: string; name: string; parentId: string | null }): FolderInfo;
  updateFolderName(id: string, name: string): FolderInfo;
  moveFolder(id: string, parentId: string | null): FolderInfo;
  deleteFolder(id: string): void;
  createChat(input: { workspaceId: string; title: string; folderId: string | null }): ChatInfo;
  updateChatTitle(id: string, title: string): ChatInfo;
  moveChat(id: string, folderId: string | null): ChatInfo;
  deleteChat(id: string): void;
}

function toFolderInfo(folder: FolderRow): FolderInfo {
  return {
    id: folder.id,
    workspaceId: folder.workspaceId,
    parentId: folder.parentId,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

function toChatInfo(chat: ChatRow): ChatInfo {
  return {
    id: chat.id,
    workspaceId: chat.workspaceId,
    folderId: chat.folderId,
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

function toChatTreeFolderNode(node: ChatTreeFolderNodeRecord): ChatTreeFolderNode {
  return {
    ...toFolderInfo(node),
    folders: node.folders.map(toChatTreeFolderNode),
    chats: node.chats.map(toChatInfo),
  };
}

function toChatTreeSnapshot(snapshot: ChatTreeSnapshotRecord): ChatTreeSnapshot {
  return {
    workspaceId: snapshot.workspaceId,
    rootFolders: snapshot.rootFolders.map(toChatTreeFolderNode),
    rootChats: snapshot.rootChats.map(toChatInfo),
  };
}

function toChatTreeFolderListItem(folder: ChatTreeFolderListItemRecord): ChatTreeFolderListItem {
  return {
    ...toFolderInfo(folder),
    childFolderCount: folder.childFolderCount,
    childChatCount: folder.childChatCount,
  };
}

function toChatTreeChildrenSlice(slice: ChatTreeChildrenSliceRecord): ChatTreeChildrenSlice {
  return {
    workspaceId: slice.workspaceId,
    parentFolderId: slice.parentFolderId,
    folders: slice.folders.map(toChatTreeFolderListItem),
    chats: slice.chats.map(toChatInfo),
  };
}

function normalizeExpandedFolderIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueFolderIds = new Set<string>();

  for (const entry of value) {
    const parsedFolderId = parseFolderId(entry);
    if (!parsedFolderId.ok) {
      continue;
    }

    uniqueFolderIds.add(parsedFolderId.value);

    if (uniqueFolderIds.size >= MAX_PERSISTED_EXPANDED_FOLDER_IDS) {
      break;
    }
  }

  return [...uniqueFolderIds].sort((left, right) => left.localeCompare(right));
}

function pruneExpandedFolderIdsForWorkspace(workspaceId: string, ids: readonly string[]): string[] {
  if (ids.length === 0) {
    return [];
  }

  const existingFolderIds = new Set(listWorkspaceFolderIds(workspaceId, ids));
  return ids.filter((id) => existingFolderIds.has(id));
}

export function createChatTreeService(): ChatTreeService {
  function readChatTreeUiState(workspaceId: string): ChatTreeUiState {
    const workspaceSettings = getWorkspaceSettings(workspaceId);
    const normalizedFolderIds = normalizeExpandedFolderIds(
      workspaceSettings[CHAT_TREE_EXPANDED_FOLDER_IDS_SETTINGS_KEY],
    );

    return {
      expandedFolderIds: pruneExpandedFolderIdsForWorkspace(workspaceId, normalizedFolderIds),
    };
  }

  function writeChatTreeUiState(workspaceId: string, expandedFolderIds: unknown): ChatTreeUiState {
    const normalizedFolderIds = normalizeExpandedFolderIds(expandedFolderIds);
    const prunedFolderIds = pruneExpandedFolderIdsForWorkspace(workspaceId, normalizedFolderIds);

    updateWorkspaceSettings(workspaceId, {
      [CHAT_TREE_EXPANDED_FOLDER_IDS_SETTINGS_KEY]: prunedFolderIds,
    });

    return {
      expandedFolderIds: prunedFolderIds,
    };
  }

  return {
    getChatTree(workspaceId: string): ChatTreeSnapshot {
      return toChatTreeSnapshot(getChatTree(workspaceId));
    },

    getChatTreeChildren(workspaceId: string, parentFolderId: string | null): ChatTreeChildrenSlice {
      return toChatTreeChildrenSlice(getChatTreeChildren(workspaceId, parentFolderId));
    },

    getChatTreeUiState(workspaceId: string): ChatTreeUiState {
      return readChatTreeUiState(workspaceId);
    },

    setChatTreeUiState(workspaceId: string, expandedFolderIds: string[]): ChatTreeUiState {
      return writeChatTreeUiState(workspaceId, expandedFolderIds);
    },

    createFolder(input): FolderInfo {
      return toFolderInfo(createFolder(input));
    },

    updateFolderName(id: string, name: string): FolderInfo {
      return toFolderInfo(updateFolderName(id, name));
    },

    moveFolder(id: string, parentId: string | null): FolderInfo {
      return toFolderInfo(moveFolder(id, parentId));
    },

    deleteFolder(id: string): void {
      const deletionResult = deleteFolderRecursive(id);
      if (deletionResult.deletedFolderIds.length === 0) {
        return;
      }

      const currentUiState = readChatTreeUiState(deletionResult.workspaceId);
      const deletedFolderIds = new Set(deletionResult.deletedFolderIds);
      const nextExpandedFolderIds = currentUiState.expandedFolderIds.filter(
        (folderId) => !deletedFolderIds.has(folderId),
      );

      if (nextExpandedFolderIds.length !== currentUiState.expandedFolderIds.length) {
        writeChatTreeUiState(deletionResult.workspaceId, nextExpandedFolderIds);
      }
    },

    createChat(input): ChatInfo {
      return toChatInfo(createChat(input));
    },

    updateChatTitle(id: string, title: string): ChatInfo {
      return toChatInfo(updateChatTitle(id, title));
    },

    moveChat(id: string, folderId: string | null): ChatInfo {
      return toChatInfo(moveChat(id, folderId));
    },

    deleteChat(id: string): void {
      deleteChat(id);
    },
  };
}
