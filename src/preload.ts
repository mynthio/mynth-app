// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  listWorkspaces: () => ipcRenderer.invoke("workspaces:list"),
  getActiveWorkspace: () => ipcRenderer.invoke("workspaces:getActive"),
  setActiveWorkspace: (id: string) => ipcRenderer.invoke("workspaces:setActive", id),
});
