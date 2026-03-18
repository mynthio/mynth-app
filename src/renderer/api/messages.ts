import "../lib/electron-api";
import type { MynthUiMessage } from "@shared/chat/message-metadata";
import type { EditMessageBehavior } from "@shared/ipc";

export const messagesApi = {
  listMessages(chatId: string, branchId?: string | null): Promise<MynthUiMessage[]> {
    return window.electronAPI.listChatMessages(chatId, branchId);
  },

  listAllMessages(chatId: string): Promise<MynthUiMessage[]> {
    return window.electronAPI.listAllChatMessages(chatId);
  },

  switchBranch(chatId: string, branchId: string): Promise<MynthUiMessage[]> {
    return window.electronAPI.switchChatBranch(chatId, branchId);
  },

  editMessage(
    messageId: string,
    text: string,
    behavior: EditMessageBehavior,
  ): Promise<MynthUiMessage[]> {
    return window.electronAPI.editMessage(messageId, text, behavior);
  },
};
