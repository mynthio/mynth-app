import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { parse, stringify } from "smol-toml";

import { getWorkspacePaths } from "../db/workspaces";

export interface WorkspaceConfig {
  name: string;
}

const WORKSPACE_CONFIG_FILENAME = "workspace.toml";

export function getDefaultWorkspaceName(id: string): string {
  if (id === "default") return "Default";
  return id
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getWorkspaceConfig(workspaceId: string): WorkspaceConfig {
  const { workspaceDir } = getWorkspacePaths(workspaceId);
  const configPath = join(workspaceDir, WORKSPACE_CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return { name: getDefaultWorkspaceName(workspaceId) };
  }

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = parse(raw) as Partial<WorkspaceConfig>;
    return {
      name: parsed.name ?? getDefaultWorkspaceName(workspaceId),
    };
  } catch {
    return { name: getDefaultWorkspaceName(workspaceId) };
  }
}

export function updateWorkspaceConfig(
  workspaceId: string,
  patch: Partial<WorkspaceConfig>,
): void {
  const { workspaceDir } = getWorkspacePaths(workspaceId);
  const configPath = join(workspaceDir, WORKSPACE_CONFIG_FILENAME);
  const current = getWorkspaceConfig(workspaceId);
  const updated = { ...current, ...patch };

  mkdirSync(workspaceDir, { recursive: true });
  writeFileSync(
    configPath,
    stringify(updated as unknown as Record<string, unknown>),
    "utf-8",
  );
}
