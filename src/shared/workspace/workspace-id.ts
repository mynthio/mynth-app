export const WORKSPACE_ID_MAX_LENGTH = 64;
export const WORKSPACE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

type ParseWorkspaceIdResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

export function parseWorkspaceId(input: unknown): ParseWorkspaceIdResult {
  if (typeof input !== "string") {
    return { ok: false, error: "Workspace ID must be a string." };
  }

  if (input.length === 0) {
    return { ok: false, error: "Workspace ID must not be empty." };
  }

  if (input.length > WORKSPACE_ID_MAX_LENGTH) {
    return {
      ok: false,
      error: `Workspace ID must be at most ${WORKSPACE_ID_MAX_LENGTH} characters.`,
    };
  }

  if (!WORKSPACE_ID_PATTERN.test(input)) {
    return {
      ok: false,
      error: "Workspace ID is invalid. Allowed: letters, numbers, underscore, hyphen.",
    };
  }

  return {
    ok: true,
    value: input,
  };
}
