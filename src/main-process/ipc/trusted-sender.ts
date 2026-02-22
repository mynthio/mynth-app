import type { IpcMainInvokeEvent } from "electron";

function isTrustedDevServerUrl(url: string): boolean {
  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    return false;
  }

  try {
    const sender = new URL(url);
    const devServer = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    return sender.origin === devServer.origin;
  } catch {
    return false;
  }
}

export function isTrustedRendererUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  if (isTrustedDevServerUrl(url)) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "file:";
  } catch {
    return false;
  }
}

export function assertTrustedIpcSender(event: IpcMainInvokeEvent): void {
  const senderUrl = event.senderFrame?.url ?? "";

  if (!isTrustedRendererUrl(senderUrl)) {
    throw new Error(`Blocked IPC from untrusted sender URL "${senderUrl || "unknown"}".`);
  }
}
