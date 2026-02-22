import { getConfig, updateConfig } from "../config";
import { createUuidV7 } from "../db/uuidv7";
import { ensureWorkspaceFilesystem } from "../workspaces/filesystem";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  listWorkspaces,
  updateWorkspaceName,
  type WorkspaceRow,
} from "../workspaces/repository";
import type { WorkspaceInfo } from "../../shared/ipc";

export interface WorkspaceService {
  listWorkspaces(): WorkspaceInfo[];
  getActiveWorkspace(): WorkspaceInfo;
  createWorkspace(name: string): WorkspaceInfo;
  setActiveWorkspace(id: string): WorkspaceInfo;
  updateWorkspaceName(id: string, name: string): WorkspaceInfo;
}

function toWorkspaceInfo(workspace: Pick<WorkspaceRow, "id" | "name">): WorkspaceInfo {
  return { id: workspace.id, name: workspace.name };
}

function createWorkspaceId(existingIds: readonly string[]): string {
  const existingIdsSet = new Set(existingIds);
  for (;;) {
    const candidateId = createUuidV7();
    if (!existingIdsSet.has(candidateId)) {
      return candidateId;
    }
  }
}

function getWorkspaceInfoById(id: string): WorkspaceInfo {
  const workspace = getWorkspaceById(id);
  if (!workspace) {
    throw new Error(`Workspace "${id}" does not exist.`);
  }
  return toWorkspaceInfo(workspace);
}

export function createWorkspaceService(): WorkspaceService {
  return {
    listWorkspaces(): WorkspaceInfo[] {
      return listWorkspaces().map(toWorkspaceInfo);
    },

    getActiveWorkspace(): WorkspaceInfo {
      const workspaceInfos = listWorkspaces().map(toWorkspaceInfo);
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
    },

    createWorkspace(name: string): WorkspaceInfo {
      const workspaceId = createWorkspaceId(listWorkspaces().map((workspace) => workspace.id));

      const createdWorkspace = createWorkspace({
        id: workspaceId,
        name,
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
    },

    setActiveWorkspace(id: string): WorkspaceInfo {
      if (!getWorkspaceById(id)) {
        throw new Error(`Workspace "${id}" does not exist.`);
      }

      updateConfig({ app: { activeWorkspaceId: id } });
      return getWorkspaceInfoById(id);
    },

    updateWorkspaceName(id: string, name: string): WorkspaceInfo {
      if (!getWorkspaceById(id)) {
        throw new Error(`Workspace "${id}" does not exist.`);
      }

      return toWorkspaceInfo(updateWorkspaceName(id, name));
    },
  };
}
