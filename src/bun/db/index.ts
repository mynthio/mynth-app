import { migrateDatabaseFile } from "./database";
import {
  ensureWorkspaceFilesystem,
  ensureWorkspaceRootDirectory,
  listWorkspaceIds,
  type WorkspacePaths,
} from "./workspaces";

export type { WorkspacePaths } from "./workspaces";
export { getWorkspacePaths, getWorkspacesRootDirectory, listWorkspaceIds } from "./workspaces";

export interface WorkspaceBootstrapResult {
  rootDir: string;
  discoveredWorkspaceIds: string[];
  migratedWorkspaceIds: string[];
}

export function ensureWorkspaceDatabase(workspaceId: string): WorkspacePaths {
  const workspacePaths = ensureWorkspaceFilesystem(workspaceId);
  migrateDatabaseFile(workspacePaths.dbPath);
  return workspacePaths;
}

export function bootstrapWorkspaceDatabases(): WorkspaceBootstrapResult {
  const rootDir = ensureWorkspaceRootDirectory();
  const discoveredWorkspaceIds = listWorkspaceIds();
  const migratedWorkspaceIds: string[] = [];

  for (const workspaceId of discoveredWorkspaceIds) {
    ensureWorkspaceDatabase(workspaceId);
    migratedWorkspaceIds.push(workspaceId);
  }

  return {
    rootDir,
    discoveredWorkspaceIds,
    migratedWorkspaceIds,
  };
}
