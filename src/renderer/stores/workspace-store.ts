import { create } from "zustand";

import "../lib/electron-api";
import type { WorkspaceInfo } from "../../shared/ipc";

interface WorkspaceState {
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  initialize: () => Promise<void>;
  setActive: (id: string) => Promise<void>;
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

  setActive: async (id: string) => {
    const activeWorkspace = await window.electronAPI.setActiveWorkspace(id);
    set({ activeWorkspace });
  },
}));
