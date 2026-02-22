import {
  createChat,
  createFolder,
  deleteChat,
  deleteFolderRecursive,
  getChatTree,
  moveChat,
  moveFolder,
  updateChatTitle,
  updateFolderName,
  type ChatRow,
  type ChatTreeFolderNode as ChatTreeFolderNodeRecord,
  type ChatTreeSnapshot as ChatTreeSnapshotRecord,
  type FolderRow,
} from "../chat-tree/repository";
import type { ChatInfo, ChatTreeFolderNode, ChatTreeSnapshot, FolderInfo } from "../../shared/ipc";

export interface ChatTreeService {
  getChatTree(workspaceId: string): ChatTreeSnapshot;
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

export function createChatTreeService(): ChatTreeService {
  return {
    getChatTree(workspaceId: string): ChatTreeSnapshot {
      return toChatTreeSnapshot(getChatTree(workspaceId));
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
      deleteFolderRecursive(id);
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
