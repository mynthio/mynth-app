import "../lib/electron-api";
import { parseWorkspaceId } from "../../shared/workspace/workspace-id";

export const workspaceApi = {
  list() {
    return window.electronAPI.listWorkspaces();
  },

  getActive() {
    return window.electronAPI.getActiveWorkspace();
  },

  create(name: string) {
    return window.electronAPI.createWorkspace(name);
  },

  setActive(workspaceId: string) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.setActiveWorkspace(parsedWorkspaceId.value);
  },

  updateName(workspaceId: string, name: string) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.updateWorkspaceName(parsedWorkspaceId.value, name);
  },
};
