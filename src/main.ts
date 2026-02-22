import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { getConfig, getConfigPath } from "./main-process/config";
import { DEFAULT_WORKSPACE_ID, bootstrapStorage } from "./main-process/db";
import { closeAppDatabase } from "./main-process/db/database";
import { registerIpcHandlers } from "./main-process/ipc";
import { isTrustedRendererUrl } from "./main-process/ipc/trusted-sender";
import { WINDOW_TOOLBAR_HEIGHT, WINDOW_TRAFFIC_LIGHTS_POSITION } from "./shared/window-chrome";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Enforce a single running instance. If a second instance is launched,
// focus the existing window and quit the new one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;

  function createWindow() {
    const isMac = process.platform === "darwin";

    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      ...(isMac
        ? {
            titleBarStyle: "hiddenInset" as const,
            trafficLightPosition: WINDOW_TRAFFIC_LIGHTS_POSITION,
            titleBarOverlay: {
              color: "#00000000",
              symbolColor: "#ffffff",
              height: WINDOW_TOOLBAR_HEIGHT,
            },
          }
        : {}),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
      },
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    mainWindow.webContents.on("will-navigate", (event, url) => {
      if (!isTrustedRendererUrl(url)) {
        event.preventDefault();
      }
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
  }

  // When a second instance is attempted, bring the existing window to front.
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app
    .whenReady()
    .then(() => {
      try {
        const config = getConfig();
        console.log(`Config loaded from: ${getConfigPath()} — theme: ${config.app.theme}`);

        const storageBootstrap = bootstrapStorage();
        const defaultWorkspaceLog = storageBootstrap.createdDefaultWorkspace
          ? ` Created default workspace "${DEFAULT_WORKSPACE_ID}".`
          : "";
        console.log(
          `Storage bootstrap complete. App DB: ${storageBootstrap.dbPath}. Workspace assets root: ${storageBootstrap.workspacesRootDir}. Workspaces: ${storageBootstrap.workspaceIds.length}.${defaultWorkspaceLog}`,
        );

        registerIpcHandlers();
        createWindow();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        dialog.showErrorBox("Startup failed", `The app could not initialize.\n\n${message}`);
        app.quit();
      }
    })
    .catch((error) => {
      console.error("Electron app failed before initialization.", error);
      app.quit();
    });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Close the SQLite connection before the process exits so WAL is
  // checkpointed and no data is left in a partial write state.
  app.on("before-quit", () => {
    closeAppDatabase();
  });
}
