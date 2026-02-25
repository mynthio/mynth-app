import { IPC_CHANNELS, type IpcApi } from "../../shared/ipc";
import { invokeIpc } from "../invoke";

type WorkspaceApi = Pick<
  IpcApi,
  | "listWorkspaces"
  | "getActiveWorkspace"
  | "createWorkspace"
  | "setActiveWorkspace"
  | "updateWorkspace"
>;

export function createWorkspaceApi(): WorkspaceApi {
  return {
    listWorkspaces: () => invokeIpc(IPC_CHANNELS.workspaces.list),
    getActiveWorkspace: () => invokeIpc(IPC_CHANNELS.workspaces.getActive),
    createWorkspace: (name) => invokeIpc(IPC_CHANNELS.workspaces.create, name),
    setActiveWorkspace: (id) => invokeIpc(IPC_CHANNELS.workspaces.setActive, id),
    updateWorkspace: (id, input) => invokeIpc(IPC_CHANNELS.workspaces.update, id, input),
  };
}
