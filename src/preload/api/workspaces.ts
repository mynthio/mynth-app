import { IPC_CHANNELS, type IpcApi } from "../../shared/ipc";
import { invokeIpc } from "../invoke";

type WorkspaceApi = Pick<
  IpcApi,
  | "listWorkspaces"
  | "getActiveWorkspace"
  | "createWorkspace"
  | "setActiveWorkspace"
  | "updateWorkspace"
  | "updateWorkspaceSettings"
  | "getTabsUiState"
>;

export function createWorkspaceApi(): WorkspaceApi {
  return {
    listWorkspaces: () => invokeIpc(IPC_CHANNELS.workspaces.list),
    getActiveWorkspace: (options) => invokeIpc(IPC_CHANNELS.workspaces.getActive, options),
    createWorkspace: (name) => invokeIpc(IPC_CHANNELS.workspaces.create, name),
    setActiveWorkspace: (id) => invokeIpc(IPC_CHANNELS.workspaces.setActive, id),
    updateWorkspace: (id, input) => invokeIpc(IPC_CHANNELS.workspaces.update, id, input),
    updateWorkspaceSettings: (id, settingsPatch) =>
      invokeIpc(IPC_CHANNELS.workspaces.updateSettings, id, settingsPatch),
    getTabsUiState: (workspaceId) => invokeIpc(IPC_CHANNELS.chatTree.getTabsUiState, workspaceId),
  };
}
