import { getConfig, getConfigPath } from "../config";
import { DEFAULT_WORKSPACE_ID, bootstrapStorage, type StorageBootstrapResult } from "../db";
import { type IpcHandlerContext } from "../ipc/core/context";
import { createTrustedSenderRegistry, type TrustedSenderRegistry } from "../ipc/trusted-senders";
import { createAppServices, type AppServices } from "../services";

export interface BackendBootstrapResult {
  services: AppServices;
  trustedSenders: TrustedSenderRegistry;
  ipcContext: IpcHandlerContext;
  storageBootstrap: StorageBootstrapResult;
}

export function bootstrapBackend(): BackendBootstrapResult {
  const config = getConfig();
  console.log(`Config loaded from: ${getConfigPath()} - theme: ${config.app.theme}`);

  const storageBootstrap = bootstrapStorage();
  const defaultWorkspaceLog = storageBootstrap.createdDefaultWorkspace
    ? ` Created default workspace "${DEFAULT_WORKSPACE_ID}".`
    : "";
  console.log(
    `Storage bootstrap complete. App DB: ${storageBootstrap.dbPath}. Workspace assets root: ${storageBootstrap.workspacesRootDir}. Workspaces: ${storageBootstrap.workspaceIds.length}.${defaultWorkspaceLog}`,
  );

  const services = createAppServices();
  const trustedSenders = createTrustedSenderRegistry();
  const ipcContext: IpcHandlerContext = {
    services,
    trustedSenders,
  };

  return {
    services,
    trustedSenders,
    ipcContext,
    storageBootstrap,
  };
}
