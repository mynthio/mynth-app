import { getConfig, updateConfig } from "../config";
import { ensureWorkspaceFilesystem } from "../workspaces/filesystem";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  listWorkspaces,
  updateWorkspaceName,
  type WorkspaceRow,
} from "../workspaces/repository";
import { IPC_CHANNELS, type WorkspaceInfo } from "../../shared/ipc";
import { WORKSPACE_ID_MAX_LENGTH, parseWorkspaceId } from "../../shared/workspace-id";
import { parseWorkspaceName } from "../../shared/workspace-name";
import { registerIpcHandler } from "./register-handler";

const DEFAULT_WORKSPACE_ID_BASE = "workspace";

function toWorkspaceInfo(workspace: Pick<WorkspaceRow, "id" | "name">): WorkspaceInfo {
  return { id: workspace.id, name: workspace.name };
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

function getWorkspaceInfos(): WorkspaceInfo[] {
  return listWorkspaces().map(toWorkspaceInfo);
}

function getWorkspaceInfoById(id: string): WorkspaceInfo {
  const workspace = getWorkspaceById(id);
  if (!workspace) {
    throw new Error(`Workspace "${id}" does not exist.`);
  }
  return toWorkspaceInfo(workspace);
}

function parseExistingWorkspaceId(input: unknown): string {
  const parsedId = parseWorkspaceId(input);
  if (!parsedId.ok) {
    throw new Error(parsedId.error);
  }

  if (!getWorkspaceById(parsedId.value)) {
    throw new Error(`Workspace "${parsedId.value}" does not exist.`);
  }

  return parsedId.value;
}

function parseValidWorkspaceName(input: unknown): string {
  const parsedName = parseWorkspaceName(input);
  if (!parsedName.ok) {
    throw new Error(parsedName.error);
  }

  return parsedName.value;
}

function getActiveWorkspace(): WorkspaceInfo {
  const workspaceInfos = getWorkspaceInfos();
  const configuredActiveWorkspaceId = getConfig().app.activeWorkspaceId;

  const activeWorkspace = workspaceInfos.find(
    (workspaceInfo) => workspaceInfo.id === configuredActiveWorkspaceId,
  );
  if (activeWorkspace) {
    return activeWorkspace;
  }

  const fallbackWorkspace = workspaceInfos[0];
  if (!fallbackWorkspace) {
    throw new Error("No workspaces available.");
  }

  updateConfig({ app: { activeWorkspaceId: fallbackWorkspace.id } });
  return fallbackWorkspace;
}

export function registerWorkspaceHandlers(): void {
  registerIpcHandler(IPC_CHANNELS.workspaces.list, (): WorkspaceInfo[] => {
    return getWorkspaceInfos();
  });

  registerIpcHandler(IPC_CHANNELS.workspaces.getActive, (): WorkspaceInfo => {
    return getActiveWorkspace();
  });

  registerIpcHandler(IPC_CHANNELS.workspaces.create, (_event, name: unknown): WorkspaceInfo => {
    const validName = parseValidWorkspaceName(name);
    const workspaceId = createWorkspaceId(
      validName,
      listWorkspaces().map((workspace) => workspace.id),
    );

    const createdWorkspace = createWorkspace({
      id: workspaceId,
      name: validName,
      settings: {},
    });

    try {
      ensureWorkspaceFilesystem(workspaceId);
    } catch (error) {
      try {
        deleteWorkspace(workspaceId);
      } catch (rollbackError) {
        console.error(
          `[workspaces] Failed to roll back workspace "${workspaceId}" after filesystem error.`,
          rollbackError,
        );
      }
      throw error;
    }

    updateConfig({ app: { activeWorkspaceId: workspaceId } });
    return toWorkspaceInfo(createdWorkspace);
  });

  registerIpcHandler(IPC_CHANNELS.workspaces.setActive, (_event, id: unknown): WorkspaceInfo => {
    const workspaceId = parseExistingWorkspaceId(id);
    updateConfig({ app: { activeWorkspaceId: workspaceId } });
    return getWorkspaceInfoById(workspaceId);
  });

  registerIpcHandler(
    IPC_CHANNELS.workspaces.updateName,
    (_event, id: unknown, name: unknown): WorkspaceInfo => {
      const workspaceId = parseExistingWorkspaceId(id);
      const validName = parseValidWorkspaceName(name);

      const workspace = updateWorkspaceName(workspaceId, validName);
      return toWorkspaceInfo(workspace);
    },
  );
}
