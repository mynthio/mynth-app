import {
  createChat,
  createFolder,
  deleteChat,
  deleteFolderRecursive,
  getChatById,
  getChatTreeChildren,
  getChatTree,
  listWorkspaceChatIds,
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
import { parseChatId } from "../../shared/chat/chat-id";
import { parseFolderId } from "../../shared/folder/folder-id";
import type {
  ChatInfo,
  ChatTabsUiState,
  ChatTabStateItem,
  ChatTreeChildrenSlice,
  ChatTreeFolderListItem,
  ChatTreeFolderNode,
  ChatTreeSnapshot,
  ChatTreeUiState,
  FolderInfo,
} from "../../shared/ipc";
import { getWorkspaceSettings, updateWorkspaceSettings } from "../workspaces/repository";

const CHAT_TREE_EXPANDED_FOLDER_IDS_SETTINGS_KEY = "chatTreeExpandedFolderIds";
const CHAT_TABS_SETTINGS_KEY = "chatTabs";
const MAX_PERSISTED_EXPANDED_FOLDER_IDS = 2000;
const MAX_PERSISTED_TABS = 20;

export interface ChatTreeService {
  getChat(id: string): ChatInfo;
  getChatTree(workspaceId: string): ChatTreeSnapshot;
  getChatTreeChildren(workspaceId: string, parentFolderId: string | null): ChatTreeChildrenSlice;
  getChatTreeUiState(workspaceId: string): ChatTreeUiState;
  setChatTreeUiState(workspaceId: string, expandedFolderIds: string[]): ChatTreeUiState;
  getChatTabsUiState(workspaceId: string): ChatTabsUiState;
  setChatTabsUiState(workspaceId: string, tabs: ChatTabStateItem[]): ChatTabsUiState;
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

function normalizeChatTabs(value: unknown): ChatTabStateItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenChatIds = new Set<string>();
  const normalizedTabs: ChatTabStateItem[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const parsedChatId = parseChatId(record.chatId);
    if (!parsedChatId.ok || seenChatIds.has(parsedChatId.value)) {
      continue;
    }

    seenChatIds.add(parsedChatId.value);
    normalizedTabs.push({ chatId: parsedChatId.value });

    if (normalizedTabs.length >= MAX_PERSISTED_TABS) {
      break;
    }
  }

  return normalizedTabs;
}

function pruneExpandedFolderIdsForWorkspace(workspaceId: string, ids: readonly string[]): string[] {
  if (ids.length === 0) {
    return [];
  }

  const existingFolderIds = new Set(listWorkspaceFolderIds(workspaceId, ids));
  return ids.filter((id) => existingFolderIds.has(id));
}

function pruneTabsForWorkspace(
  workspaceId: string,
  tabs: readonly ChatTabStateItem[],
): ChatTabStateItem[] {
  if (tabs.length === 0) {
    return [];
  }

  const existingChatIds = new Set(
    listWorkspaceChatIds(
      workspaceId,
      tabs.map((tab) => tab.chatId),
    ),
  );
  return tabs.filter((tab) => existingChatIds.has(tab.chatId));
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

  function readChatTabsUiState(workspaceId: string): ChatTabsUiState {
    const workspaceSettings = getWorkspaceSettings(workspaceId);
    const normalizedTabs = normalizeChatTabs(workspaceSettings[CHAT_TABS_SETTINGS_KEY]);

    return {
      tabs: pruneTabsForWorkspace(workspaceId, normalizedTabs),
    };
  }

  function writeChatTabsUiState(workspaceId: string, tabs: unknown): ChatTabsUiState {
    const normalizedTabs = normalizeChatTabs(tabs);
    const prunedTabs = pruneTabsForWorkspace(workspaceId, normalizedTabs);

    updateWorkspaceSettings(workspaceId, {
      [CHAT_TABS_SETTINGS_KEY]: prunedTabs,
    });

    return {
      tabs: prunedTabs,
    };
  }

  return {
    getChat(id: string): ChatInfo {
      const chat = getChatById(id);
      if (!chat) {
        throw new Error(`Chat "${id}" does not exist.`);
      }

      return toChatInfo(chat);
    },

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

    getChatTabsUiState(workspaceId: string): ChatTabsUiState {
      return readChatTabsUiState(workspaceId);
    },

    setChatTabsUiState(workspaceId: string, tabs: ChatTabStateItem[]): ChatTabsUiState {
      return writeChatTabsUiState(workspaceId, tabs);
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
      const deletedChat = deleteChat(id);
      const currentTabsUiState = readChatTabsUiState(deletedChat.workspaceId);
      const nextTabs = currentTabsUiState.tabs.filter((tab) => tab.chatId !== deletedChat.id);

      if (nextTabs.length !== currentTabsUiState.tabs.length) {
        writeChatTabsUiState(deletedChat.workspaceId, nextTabs);
      }
    },
  };
}
