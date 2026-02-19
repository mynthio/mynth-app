export interface WorkspaceInfo {
  id: string;
  name: string;
}

export type IpcApi = {
  listWorkspaces: () => Promise<WorkspaceInfo[]>;
  getActiveWorkspace: () => Promise<WorkspaceInfo>;
  setActiveWorkspace: (id: string) => Promise<WorkspaceInfo>;
};
