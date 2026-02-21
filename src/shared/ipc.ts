export interface WorkspaceInfo {
  id: string;
  name: string;
}

export type IpcApi = {
  listWorkspaces: () => Promise<WorkspaceInfo[]>;
  getActiveWorkspace: () => Promise<WorkspaceInfo>;
  createWorkspace: (name: string) => Promise<WorkspaceInfo>;
  setActiveWorkspace: (id: string) => Promise<WorkspaceInfo>;
  updateWorkspaceName: (id: string, name: string) => Promise<WorkspaceInfo>;
};
