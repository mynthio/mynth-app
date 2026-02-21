import { create } from "zustand";

import "../lib/electron-api";
import type { WorkspaceInfo } from "../../shared/ipc";

interface WorkspaceState {
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  initialize: () => Promise<void>;
  createWorkspace: (name: string) => Promise<WorkspaceInfo>;
  setActive: (id: string) => Promise<void>;
  updateWorkspaceName: (id: string, name: string) => Promise<WorkspaceInfo>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,

  initialize: async () => {
    const [workspaces, activeWorkspace] = await Promise.all([
      window.electronAPI.listWorkspaces(),
      window.electronAPI.getActiveWorkspace(),
    ]);
    set({ workspaces, activeWorkspace });
  },

  createWorkspace: async (name: string) => {
    const activeWorkspace = await window.electronAPI.createWorkspace(name);
    const workspaces = await window.electronAPI.listWorkspaces();
    set({ workspaces, activeWorkspace });
    return activeWorkspace;
  },

  setActive: async (id: string) => {
    const activeWorkspace = await window.electronAPI.setActiveWorkspace(id);
    set({ activeWorkspace });
  },

  updateWorkspaceName: async (id: string, name: string) => {
    const updatedWorkspace = await window.electronAPI.updateWorkspaceName(id, name);

    set((state) => ({
      workspaces: state.workspaces.map((workspace) =>
        workspace.id === id ? updatedWorkspace : workspace,
      ),
      activeWorkspace: state.activeWorkspace?.id === id ? updatedWorkspace : state.activeWorkspace,
    }));

    return updatedWorkspace;
  },
}));
