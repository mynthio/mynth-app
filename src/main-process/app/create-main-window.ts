import { BrowserWindow } from "electron";
import path from "node:path";

import { isTrustedRendererUrl, type TrustedSenderRegistry } from "../ipc/trusted-senders";
import { WINDOW_TOOLBAR_HEIGHT, WINDOW_TRAFFIC_LIGHTS_POSITION } from "../../shared/window-chrome";
import { createPersistentWindowState } from "../lib/persistent-window-state";

export interface CreateMainWindowOptions {
  trustedSenders: TrustedSenderRegistry;
  onClosed?: () => void;
}

export function createMainWindow(options: CreateMainWindowOptions): BrowserWindow {
  const isMac = process.platform === "darwin";
  const windowState = createPersistentWindowState({
    windowId: "main",
    defaultSize: {
      width: 800,
      height: 600,
    },
  });

  const mainWindow = new BrowserWindow({
    ...windowState.browserWindowOptions,
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

  options.trustedSenders.registerTrustedWebContents(mainWindow.webContents);

  windowState.attach(mainWindow);

  mainWindow.on("closed", () => {
    options.onClosed?.();
  });

  mainWindow.webContents.on("destroyed", () => {
    options.trustedSenders.unregisterTrustedWebContents(mainWindow.webContents.id);
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedRendererUrl(url)) {
      event.preventDefault();
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  return mainWindow;
}
