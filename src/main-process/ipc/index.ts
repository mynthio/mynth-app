import type { IpcHandlerContext } from "./core/context";
import { registerChatTreeIpcModule } from "./modules/chat-tree";
import { registerWorkspaceIpcModule } from "./modules/workspaces";

export function registerIpcHandlers(context: IpcHandlerContext): void {
  const registeredChannels = new Set<string>();
  registerWorkspaceIpcModule(context, registeredChannels);
  registerChatTreeIpcModule(context, registeredChannels);
}
