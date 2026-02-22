import { getAppDatabasePath, migrateAppDatabase } from "./database";
import { ensureDefaultWorkspace, listWorkspaces } from "../workspaces/repository";
import { ensureWorkspaceFilesystem, ensureWorkspaceRootDirectory } from "../workspaces/filesystem";

export type { WorkspacePaths } from "../workspaces/filesystem";
export {
  DEFAULT_WORKSPACE_ID,
  ensureWorkspaceFilesystem,
  ensureWorkspaceRootDirectory,
  getWorkspacePaths,
  getWorkspacesRootDirectory,
} from "../workspaces/filesystem";

export interface StorageBootstrapResult {
  dbPath: string;
  workspacesRootDir: string;
  workspaceIds: string[];
  createdDefaultWorkspace: boolean;
}

export function bootstrapStorage(): StorageBootstrapResult {
  migrateAppDatabase();

  const discoveredWorkspaces = listWorkspaces();
  const createdDefaultWorkspace = discoveredWorkspaces.length === 0;
  if (createdDefaultWorkspace) {
    ensureDefaultWorkspace();
  }

  const workspaces = listWorkspaces();
  const workspacesRootDir = ensureWorkspaceRootDirectory();

  for (const workspace of workspaces) {
    ensureWorkspaceFilesystem(workspace.id);
  }

  return {
    dbPath: getAppDatabasePath(),
    workspacesRootDir,
    workspaceIds: workspaces.map((workspace) => workspace.id),
    createdDefaultWorkspace,
  };
}
