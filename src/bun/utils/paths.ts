import { join } from "node:path";
import { homedir } from "node:os";

import electrobunConfig from "../../../electrobun.config";

/**
 * Returns the platform-specific base directory for application data
 * (e.g. ~/Library/Application Support on macOS).
 */
export function getAppDataDirectory(): string {
  const home = homedir();

  switch (process.platform) {
    case "darwin":
      return join(home, "Library", "Application Support");
    case "win32":
      return process.env["LOCALAPPDATA"] ?? join(home, "AppData", "Local");
    default:
      return process.env["XDG_DATA_HOME"] ?? join(home, ".local", "share");
  }
}

/**
 * Returns the root user-data directory for this app + channel.
 * Override via MYNTH_USER_DATA_DIR for testing.
 */
export function getUserDataDirectory(): string {
  if (process.env["MYNTH_USER_DATA_DIR"]) {
    return process.env["MYNTH_USER_DATA_DIR"];
  }

  const appIdentifier =
    process.env["MYNTH_APP_IDENTIFIER"] ?? electrobunConfig.app.identifier;
  const channel =
    process.env["MYNTH_APP_CHANNEL"] ??
    process.env["ELECTROBUN_CHANNEL"] ??
    "dev";

  return join(getAppDataDirectory(), appIdentifier, channel);
}
