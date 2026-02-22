import { asc, eq } from "drizzle-orm";

import { getAppDatabase } from "../db/database";
import { workspaces } from "../db/schema";
import { DEFAULT_WORKSPACE_ID } from "./filesystem";

export type WorkspaceSettings = Record<string, unknown>;

export interface WorkspaceRow {
  id: string;
  name: string;
  settings: WorkspaceSettings;
  createdAt: number;
  updatedAt: number;
}

interface CreateWorkspaceInput {
  id: string;
  name: string;
  settings?: WorkspaceSettings;
}

type WorkspaceTableRow = typeof workspaces.$inferSelect;

function isWorkspaceSettings(value: unknown): value is WorkspaceSettings {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseWorkspaceSettings(raw: string, workspaceId: string): WorkspaceSettings {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isWorkspaceSettings(parsed)) {
      console.warn(
        `[workspaces] Invalid settings JSON object for workspace "${workspaceId}", using empty object.`,
      );
      return {};
    }
    return parsed;
  } catch (error) {
    console.warn(
      `[workspaces] Failed to parse settings JSON for workspace "${workspaceId}", using empty object.`,
      error,
    );
    return {};
  }
}

function serializeWorkspaceSettings(settings: WorkspaceSettings): string {
  if (!isWorkspaceSettings(settings)) {
    throw new Error("Workspace settings must be a JSON object.");
  }
  return JSON.stringify(settings);
}

function toWorkspaceRow(row: WorkspaceTableRow): WorkspaceRow {
  return {
    id: row.id,
    name: row.name,
    settings: parseWorkspaceSettings(row.settings, row.id),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireWorkspaceById(id: string): WorkspaceRow {
  const workspace = getWorkspaceById(id);
  if (!workspace) {
    throw new Error(`Workspace "${id}" does not exist.`);
  }
  return workspace;
}

export function getDefaultWorkspaceName(id: string): string {
  if (id === DEFAULT_WORKSPACE_ID) {
    return "Default";
  }

  return id.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function listWorkspaces(): WorkspaceRow[] {
  const rows = getAppDatabase().select().from(workspaces).orderBy(asc(workspaces.id)).all();
  return rows.map(toWorkspaceRow);
}

export function getWorkspaceById(id: string): WorkspaceRow | null {
  const row = getAppDatabase().select().from(workspaces).where(eq(workspaces.id, id)).get();
  return row ? toWorkspaceRow(row) : null;
}

export function createWorkspace(input: CreateWorkspaceInput): WorkspaceRow {
  const settings = input.settings ?? {};

  getAppDatabase()
    .insert(workspaces)
    .values({
      id: input.id,
      name: input.name,
      settings: serializeWorkspaceSettings(settings),
    })
    .run();

  return requireWorkspaceById(input.id);
}

export function deleteWorkspace(id: string): void {
  getAppDatabase().delete(workspaces).where(eq(workspaces.id, id)).run();
}

export function updateWorkspaceName(id: string, name: string): WorkspaceRow {
  getAppDatabase()
    .update(workspaces)
    .set({
      name,
      updatedAt: Date.now(),
    })
    .where(eq(workspaces.id, id))
    .run();

  return requireWorkspaceById(id);
}

export function getWorkspaceSettings(id: string): WorkspaceSettings {
  return requireWorkspaceById(id).settings;
}

export function updateWorkspaceSettings(
  id: string,
  patch: Partial<WorkspaceSettings>,
): WorkspaceRow {
  if (!isWorkspaceSettings(patch)) {
    throw new Error("Workspace settings patch must be a JSON object.");
  }

  const currentSettings = getWorkspaceSettings(id);
  const nextSettings: WorkspaceSettings = {
    ...currentSettings,
    ...patch,
  };

  getAppDatabase()
    .update(workspaces)
    .set({
      settings: serializeWorkspaceSettings(nextSettings),
      updatedAt: Date.now(),
    })
    .where(eq(workspaces.id, id))
    .run();

  return requireWorkspaceById(id);
}

export function ensureDefaultWorkspace(): WorkspaceRow {
  const existingWorkspace = listWorkspaces()[0];
  if (existingWorkspace) {
    return existingWorkspace;
  }

  return createWorkspace({
    id: DEFAULT_WORKSPACE_ID,
    name: getDefaultWorkspaceName(DEFAULT_WORKSPACE_ID),
    settings: {},
  });
}
