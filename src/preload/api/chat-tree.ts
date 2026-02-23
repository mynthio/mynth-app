import { IPC_CHANNELS, type IpcApi } from "../../shared/ipc";
import { invokeIpc } from "../invoke";

type ChatTreeApi = Pick<
  IpcApi,
  | "getChatTree"
  | "getChatTreeChildren"
  | "getChatTreeUiState"
  | "setChatTreeUiState"
  | "createFolder"
  | "updateFolderName"
  | "moveFolder"
  | "deleteFolder"
  | "createChat"
  | "updateChatTitle"
  | "moveChat"
  | "deleteChat"
>;

export function createChatTreeApi(): ChatTreeApi {
  return {
    getChatTree: (workspaceId) => invokeIpc(IPC_CHANNELS.chatTree.get, workspaceId),
    getChatTreeChildren: (workspaceId, parentFolderId) =>
      invokeIpc(IPC_CHANNELS.chatTree.getChildren, workspaceId, parentFolderId),
    getChatTreeUiState: (workspaceId) => invokeIpc(IPC_CHANNELS.chatTree.getUiState, workspaceId),
    setChatTreeUiState: (workspaceId, expandedFolderIds) =>
      invokeIpc(IPC_CHANNELS.chatTree.setUiState, workspaceId, expandedFolderIds),
    createFolder: (workspaceId, name, parentId) =>
      invokeIpc(IPC_CHANNELS.folders.create, workspaceId, name, parentId),
    updateFolderName: (id, name) => invokeIpc(IPC_CHANNELS.folders.updateName, id, name),
    moveFolder: (id, parentId) => invokeIpc(IPC_CHANNELS.folders.move, id, parentId),
    deleteFolder: (id) => invokeIpc(IPC_CHANNELS.folders.delete, id),
    createChat: (workspaceId, title, folderId) =>
      invokeIpc(IPC_CHANNELS.chats.create, workspaceId, title, folderId),
    updateChatTitle: (id, title) => invokeIpc(IPC_CHANNELS.chats.updateTitle, id, title),
    moveChat: (id, folderId) => invokeIpc(IPC_CHANNELS.chats.move, id, folderId),
    deleteChat: (id) => invokeIpc(IPC_CHANNELS.chats.delete, id),
  };
}
