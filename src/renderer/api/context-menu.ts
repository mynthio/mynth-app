import type { TextContextMenuInput } from "@shared/ipc";
import "../lib/electron-api";

export const contextMenuApi = {
  showTextContextMenu(input: TextContextMenuInput) {
    return window.electronAPI.showTextContextMenu(input);
  },
};
