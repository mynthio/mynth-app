import { ipcMain, type IpcMainInvokeEvent } from "electron";

import { assertTrustedIpcSender } from "./trusted-sender";

type IpcInvokeHandler<TArgs extends unknown[], TResult> = (
  event: IpcMainInvokeEvent,
  ...args: TArgs
) => TResult | Promise<TResult>;

export function registerIpcHandler<TArgs extends unknown[], TResult>(
  channel: string,
  handler: IpcInvokeHandler<TArgs, TResult>,
): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedIpcSender(event);
    return handler(event, ...(args as TArgs));
  });
}
