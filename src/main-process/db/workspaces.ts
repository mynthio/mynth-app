import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { getUserDataDirectory } from "../system/paths";

const WORKSPACES_DIRECTORY_NAME = "workspaces";
const WORKSPACE_DATABASE_FILENAME = "workspace.sqlite";
const WORKSPACE_ASSETS_DIRECTORY_NAME = "assets";
const WORKSPACE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const DEFAULT_WORKSPACE_ID = "default";

export interface WorkspacePaths {
  workspaceId: string;
  rootDir: string;
  workspaceDir: string;
  dbPath: string;
  assetsDir: string;
}

function assertWorkspaceId(workspaceId: string): void {
  if (!WORKSPACE_ID_PATTERN.test(workspaceId)) {
    throw new Error(
      `Invalid workspace ID "${workspaceId}". Allowed: letters, numbers, underscore, hyphen.`,
    );
  }
}

export function getWorkspacesRootDirectory(): string {
  return join(getUserDataDirectory(), WORKSPACES_DIRECTORY_NAME);
}

export function ensureWorkspaceRootDirectory(): string {
  const rootDir = getWorkspacesRootDirectory();
  mkdirSync(rootDir, { recursive: true });
  return rootDir;
}

export function getWorkspacePaths(workspaceId: string): WorkspacePaths {
  assertWorkspaceId(workspaceId);

  const rootDir = getWorkspacesRootDirectory();
  const workspaceDir = join(rootDir, workspaceId);
  return {
    workspaceId,
    rootDir,
    workspaceDir,
    dbPath: join(workspaceDir, WORKSPACE_DATABASE_FILENAME),
    assetsDir: join(workspaceDir, WORKSPACE_ASSETS_DIRECTORY_NAME),
  };
}

export function ensureWorkspaceFilesystem(workspaceId: string): WorkspacePaths {
  const workspacePaths = getWorkspacePaths(workspaceId);
  mkdirSync(workspacePaths.workspaceDir, { recursive: true });
  mkdirSync(workspacePaths.assetsDir, { recursive: true });
  return workspacePaths;
}

export function listWorkspaceIds(): string[] {
  const rootDir = ensureWorkspaceRootDirectory();
  const entries = readdirSync(rootDir, { withFileTypes: true });

  return entries
    .filter(
      (entry) => entry.isDirectory() && WORKSPACE_ID_PATTERN.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}
