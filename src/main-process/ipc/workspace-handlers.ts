import { ipcMain } from "electron";

import { getConfig, updateConfig } from "../config";
import { listWorkspaceIds } from "../db/workspaces";
import { getWorkspaceConfig } from "../workspaces/config";
import type { WorkspaceInfo } from "../../shared/ipc";

function buildWorkspaceInfo(id: string): WorkspaceInfo {
  return { id, name: getWorkspaceConfig(id).name };
}

export function registerWorkspaceHandlers(): void {
  ipcMain.handle("workspaces:list", (): WorkspaceInfo[] => {
    return listWorkspaceIds().map(buildWorkspaceInfo);
  });

  ipcMain.handle("workspaces:getActive", (): WorkspaceInfo => {
    const id = getConfig().app.activeWorkspaceId;
    return buildWorkspaceInfo(id);
  });

  ipcMain.handle("workspaces:setActive", (_event, id: string): WorkspaceInfo => {
    const ids = listWorkspaceIds();
    if (!ids.includes(id)) {
      throw new Error(`Workspace "${id}" does not exist.`);
    }
    updateConfig({ app: { activeWorkspaceId: id } });
    return buildWorkspaceInfo(id);
  });
}
