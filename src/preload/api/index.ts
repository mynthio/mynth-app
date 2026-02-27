import type { IpcApi } from "../../shared/ipc";
import { createChatTreeApi } from "./chat-tree";
import { createEventsApi } from "../events";
import { createModelsApi } from "./models";
import { createProvidersApi } from "./providers";
import { createSettingsApi } from "./settings";
import { createWorkspaceApi } from "./workspaces";

export function createElectronApi(): IpcApi {
  return {
    ...createWorkspaceApi(),
    ...createSettingsApi(),
    ...createChatTreeApi(),
    ...createModelsApi(),
    ...createProvidersApi(),
    ...createEventsApi(),
  };
}
