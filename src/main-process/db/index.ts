import { migrateDatabaseFile } from "./database";
import {
  DEFAULT_WORKSPACE_ID,
  ensureWorkspaceFilesystem,
  ensureWorkspaceRootDirectory,
  listWorkspaceIds,
  type WorkspacePaths,
} from "./workspaces";

export type { WorkspacePaths } from "./workspaces";
export {
  DEFAULT_WORKSPACE_ID,
  getWorkspacePaths,
  getWorkspacesRootDirectory,
  listWorkspaceIds,
} from "./workspaces";

export interface WorkspaceBootstrapResult {
  rootDir: string;
  discoveredWorkspaceIds: string[];
  migratedWorkspaceIds: string[];
  createdDefaultWorkspace: boolean;
}

export function ensureWorkspaceDatabase(workspaceId: string): WorkspacePaths {
  const workspacePaths = ensureWorkspaceFilesystem(workspaceId);
  migrateDatabaseFile(workspacePaths.dbPath);
  return workspacePaths;
}

export function bootstrapWorkspaceDatabases(): WorkspaceBootstrapResult {
  const rootDir = ensureWorkspaceRootDirectory();
  const discoveredWorkspaceIds = listWorkspaceIds();
  const createdDefaultWorkspace = discoveredWorkspaceIds.length === 0;
  const workspaceIdsToBootstrap = createdDefaultWorkspace
    ? [DEFAULT_WORKSPACE_ID]
    : discoveredWorkspaceIds;
  const migratedWorkspaceIds: string[] = [];

  for (const workspaceId of workspaceIdsToBootstrap) {
    ensureWorkspaceDatabase(workspaceId);
    migratedWorkspaceIds.push(workspaceId);
  }

  return {
    rootDir,
    discoveredWorkspaceIds: workspaceIdsToBootstrap,
    migratedWorkspaceIds,
    createdDefaultWorkspace,
  };
}
