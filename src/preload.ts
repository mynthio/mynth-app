// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  listWorkspaces: () => ipcRenderer.invoke("workspaces:list"),
  getActiveWorkspace: () => ipcRenderer.invoke("workspaces:getActive"),
  createWorkspace: (name: string) => ipcRenderer.invoke("workspaces:create", name),
  setActiveWorkspace: (id: string) => ipcRenderer.invoke("workspaces:setActive", id),
  updateWorkspaceName: (id: string, name: string) =>
    ipcRenderer.invoke("workspaces:updateName", id, name),
});
