import { createChatTreeService, type ChatTreeService } from "./chat-tree-service";
import { createWorkspaceService, type WorkspaceService } from "./workspace-service";

export interface AppServices {
  workspaces: WorkspaceService;
  chatTree: ChatTreeService;
}

export function createAppServices(): AppServices {
  return {
    workspaces: createWorkspaceService(),
    chatTree: createChatTreeService(),
  };
}
