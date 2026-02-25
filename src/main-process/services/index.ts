import { createChatTreeService, type ChatTreeService } from "./chat-tree-service";
import { createModelService, type ModelService } from "./model-service";
import { createProviderService, type ProviderService } from "./provider-service";
import { createWorkspaceService, type WorkspaceService } from "./workspace-service";

export interface AppServices {
  workspaces: WorkspaceService;
  chatTree: ChatTreeService;
  models: ModelService;
  providers: ProviderService;
}

export function createAppServices(): AppServices {
  return {
    workspaces: createWorkspaceService(),
    chatTree: createChatTreeService(),
    models: createModelService(),
    providers: createProviderService(),
  };
}
