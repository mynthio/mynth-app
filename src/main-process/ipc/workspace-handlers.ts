import { ipcMain } from "electron";

import { getConfig, updateConfig } from "../config";
import { ensureWorkspaceDatabase, listWorkspaceIds } from "../db";
import { getWorkspaceConfig, updateWorkspaceConfig } from "../workspaces/config";
import type { WorkspaceInfo } from "../../shared/ipc";
import { parseWorkspaceName } from "../../shared/workspace-name";

const DEFAULT_WORKSPACE_ID_BASE = "workspace";
const WORKSPACE_ID_MAX_LENGTH = 64;

function buildWorkspaceInfo(id: string): WorkspaceInfo {
  return { id, name: getWorkspaceConfig(id).name };
}

function toWorkspaceIdBase(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const truncated = normalized.slice(0, WORKSPACE_ID_MAX_LENGTH).replace(/-+$/g, "");
  return truncated || DEFAULT_WORKSPACE_ID_BASE;
}

function createWorkspaceId(name: string, existingIds: readonly string[]): string {
  const existingIdsSet = new Set(existingIds);
  const baseId = toWorkspaceIdBase(name);

  if (!existingIdsSet.has(baseId)) {
    return baseId;
  }

  for (let index = 2; ; index += 1) {
    const suffix = `-${index}`;
    const maxBaseLength = WORKSPACE_ID_MAX_LENGTH - suffix.length;
    const trimmedBase = baseId.slice(0, maxBaseLength).replace(/-+$/g, "");
    const candidateId = `${trimmedBase || DEFAULT_WORKSPACE_ID_BASE}${suffix}`;
    if (!existingIdsSet.has(candidateId)) {
      return candidateId;
    }
  }
}

export function registerWorkspaceHandlers(): void {
  ipcMain.removeHandler("workspaces:list");
  ipcMain.handle("workspaces:list", (): WorkspaceInfo[] => {
    return listWorkspaceIds().map(buildWorkspaceInfo);
  });

  ipcMain.removeHandler("workspaces:getActive");
  ipcMain.handle("workspaces:getActive", (): WorkspaceInfo => {
    const id = getConfig().app.activeWorkspaceId;
    return buildWorkspaceInfo(id);
  });

  ipcMain.removeHandler("workspaces:create");
  ipcMain.handle("workspaces:create", (_event, name: string): WorkspaceInfo => {
    const parsedName = parseWorkspaceName(name);
    if (!parsedName.ok) {
      throw new Error(parsedName.error);
    }

    const workspaceId = createWorkspaceId(parsedName.value, listWorkspaceIds());
    ensureWorkspaceDatabase(workspaceId);
    updateWorkspaceConfig(workspaceId, { name: parsedName.value });
    updateConfig({ app: { activeWorkspaceId: workspaceId } });

    return buildWorkspaceInfo(workspaceId);
  });

  ipcMain.removeHandler("workspaces:setActive");
  ipcMain.handle("workspaces:setActive", (_event, id: string): WorkspaceInfo => {
    const ids = listWorkspaceIds();
    if (!ids.includes(id)) {
      throw new Error(`Workspace "${id}" does not exist.`);
    }
    updateConfig({ app: { activeWorkspaceId: id } });
    return buildWorkspaceInfo(id);
  });

  ipcMain.removeHandler("workspaces:updateName");
  ipcMain.handle("workspaces:updateName", (_event, id: string, name: string): WorkspaceInfo => {
    const ids = listWorkspaceIds();
    if (!ids.includes(id)) {
      throw new Error(`Workspace "${id}" does not exist.`);
    }

    const parsedName = parseWorkspaceName(name);
    if (!parsedName.ok) {
      throw new Error(parsedName.error);
    }

    updateWorkspaceConfig(id, { name: parsedName.value });
    return buildWorkspaceInfo(id);
  });
}
