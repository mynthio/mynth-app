import { registerChatTreeHandlers } from "./chat-tree-handlers";
import { registerWorkspaceHandlers } from "./workspace-handlers";

export function registerIpcHandlers(): void {
  registerWorkspaceHandlers();
  registerChatTreeHandlers();
}
