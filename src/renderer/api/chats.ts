import "../lib/electron-api";
import type { MynthUiMessage } from "../../shared/chat/message-metadata";
import { parseWorkspaceId } from "../../shared/workspace/workspace-id";

export const chatsApi = {
  get(id: string) {
    return window.electronAPI.getChat(id);
  },

  listMessages(chatId: string, branchId?: string | null): Promise<MynthUiMessage[]> {
    return window.electronAPI.listChatMessages(chatId, branchId);
  },

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
