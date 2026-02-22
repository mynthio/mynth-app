export const UUID_V7_CANONICAL_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type ParseUuidV7Result =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

export function isUuidV7String(value: string): boolean {
  return UUID_V7_CANONICAL_PATTERN.test(value);
}

export function parseUuidV7(input: unknown, label = "ID"): ParseUuidV7Result {
  if (typeof input !== "string") {
    return {
      ok: false,
      error: `${label} must be a string.`,
    };
  }

  if (!isUuidV7String(input)) {
    return {
      ok: false,
      error: `${label} must be a canonical lowercase UUIDv7 string.`,
    };
  }

  return {
    ok: true,
    value: input,
  };
}
