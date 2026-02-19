import { join } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";

const require = createRequire(import.meta.url);

function getElectronApp(): import("electron").App | null {
  if (!process.versions.electron) {
    return null;
  }

  const electron = require("electron") as typeof import("electron");
  return electron.app;
}

/**
 * Returns the platform-specific base directory for application data
 * (e.g. ~/Library/Application Support on macOS).
 */
export function getAppDataDirectory(): string {
  const electronApp = getElectronApp();
  if (electronApp) {
    return electronApp.getPath("appData");
  }

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
    process.env["MYNTH_APP_IDENTIFIER"] ?? "app.mynth.io";
  const channel =
    process.env["MYNTH_APP_CHANNEL"] ??
    (process.env["NODE_ENV"] === "production" ? "prod" : "dev");

  const electronApp = getElectronApp();
  if (electronApp) {
    return join(electronApp.getPath("userData"), channel);
  }

  return join(getAppDataDirectory(), appIdentifier, channel);
}
