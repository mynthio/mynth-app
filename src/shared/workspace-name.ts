import { type } from "arktype";

export const WORKSPACE_NAME_MAX_LENGTH = 64;

export const workspaceNameSchema = type(`string >= 1 & string <= ${WORKSPACE_NAME_MAX_LENGTH}`);

type ParseWorkspaceNameResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

export function parseWorkspaceName(input: string): ParseWorkspaceNameResult {
  const normalized = input.trim();
  const parsed = workspaceNameSchema(normalized);

  if (parsed instanceof type.errors) {
    return {
      ok: false,
      error: parsed[0]?.message ?? "Workspace name is invalid.",
    };
  }

  return {
    ok: true,
    value: parsed,
  };
}
