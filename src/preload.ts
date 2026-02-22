// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./shared/ipc";

contextBridge.exposeInMainWorld("electronAPI", {
  listWorkspaces: () => ipcRenderer.invoke(IPC_CHANNELS.workspaces.list),
  getActiveWorkspace: () => ipcRenderer.invoke(IPC_CHANNELS.workspaces.getActive),
  createWorkspace: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.workspaces.create, name),
  setActiveWorkspace: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.workspaces.setActive, id),
  updateWorkspaceName: (id: string, name: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.workspaces.updateName, id, name),
  getChatTree: (workspaceId: string) => ipcRenderer.invoke(IPC_CHANNELS.chatTree.get, workspaceId),
  createFolder: (workspaceId: string, name: string, parentId?: string | null) =>
    ipcRenderer.invoke(IPC_CHANNELS.folders.create, workspaceId, name, parentId),
  updateFolderName: (id: string, name: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.folders.updateName, id, name),
  moveFolder: (id: string, parentId: string | null) =>
    ipcRenderer.invoke(IPC_CHANNELS.folders.move, id, parentId),
  deleteFolder: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.folders.delete, id),
  createChat: (workspaceId: string, title: string, folderId?: string | null) =>
    ipcRenderer.invoke(IPC_CHANNELS.chats.create, workspaceId, title, folderId),
  updateChatTitle: (id: string, title: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.chats.updateTitle, id, title),
  moveChat: (id: string, folderId: string | null) =>
    ipcRenderer.invoke(IPC_CHANNELS.chats.move, id, folderId),
  deleteChat: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.chats.delete, id),
});
