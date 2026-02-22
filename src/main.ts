import { app, BrowserWindow, dialog } from "electron";
import started from "electron-squirrel-startup";
import { bootstrapBackend } from "./main-process/app/bootstrap-backend";
import { createMainWindow } from "./main-process/app/create-main-window";
import { closeAppDatabase } from "./main-process/db/database";
import { registerIpcHandlers } from "./main-process/ipc";

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
  let backend: ReturnType<typeof bootstrapBackend> | null = null;

  function openMainWindow() {
    if (!backend) {
      throw new Error("Backend is not initialized.");
    }

    mainWindow = createMainWindow({
      trustedSenders: backend.trustedSenders,
      onClosed: () => {
        mainWindow = null;
      },
    });
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
        backend = bootstrapBackend();
        registerIpcHandlers(backend.ipcContext);
        openMainWindow();
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
      openMainWindow();
    }
  });

  // Close the SQLite connection before the process exits so WAL is
  // checkpointed and no data is left in a partial write state.
  app.on("before-quit", () => {
    closeAppDatabase();
  });
}
