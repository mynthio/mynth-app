import type { IpcApi } from "../../shared/ipc";
import { createChatTreeApi } from "./chat-tree";
import { createWorkspaceApi } from "./workspaces";

export function createElectronApi(): IpcApi {
  return {
    ...createWorkspaceApi(),
    ...createChatTreeApi(),
  };
}
