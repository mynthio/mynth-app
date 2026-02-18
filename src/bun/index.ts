import { BrowserWindow, Updater, Utils } from "electrobun/bun";

import { getConfig, getConfigPath } from "./config";
import { bootstrapWorkspaceDatabases } from "./db";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log(
        "Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
      );
    }
  }
  return "views://mainview/index.html";
}

// Bootstrap global config (reads config.toml or falls back to defaults)
const config = getConfig();
console.log(
  `Config loaded from: ${getConfigPath()} — theme: ${config.app.theme}`,
);

// Create the main application window
const workspaceBootstrap = bootstrapWorkspaceDatabases();
console.log(
  `Workspace DB bootstrap complete. Root: ${workspaceBootstrap.rootDir}. Migrated ${workspaceBootstrap.migratedWorkspaceIds.length}/${workspaceBootstrap.discoveredWorkspaceIds.length} discovered workspaces.`,
);

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
  title: "Mynth Desktop",
  url,
  frame: {
    width: 900,
    height: 700,
    x: 200,
    y: 200,
  },

  titleBarStyle: "hiddenInset", // or "hidden"
});

// Quit the app when the main window is closed
mainWindow.on("close", () => {
  Utils.quit();
});

console.log("Mynth desktop app started.");
