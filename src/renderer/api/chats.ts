import "../lib/electron-api";
import { parseWorkspaceId } from "../../shared/workspace/workspace-id";

export const chatsApi = {
  create(workspaceId: string, title: string, folderId?: string | null) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.createChat(parsedWorkspaceId.value, title, folderId);
  },

  updateTitle(id: string, title: string) {
    return window.electronAPI.updateChatTitle(id, title);
  },

  move(id: string, folderId: string | null) {
    return window.electronAPI.moveChat(id, folderId);
  },

  delete(id: string) {
    return window.electronAPI.deleteChat(id);
  },
};
