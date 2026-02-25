import type { IpcApi } from "../../shared/ipc";
import { createChatTreeApi } from "./chat-tree";
import { createModelsApi } from "./models";
import { createProvidersApi } from "./providers";
import { createWorkspaceApi } from "./workspaces";

export function createElectronApi(): IpcApi {
  return {
    ...createWorkspaceApi(),
    ...createChatTreeApi(),
    ...createModelsApi(),
    ...createProvidersApi(),
  };
}
