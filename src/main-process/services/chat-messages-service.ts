import { normalizeChatMessageMetadata, type MynthUiMessage } from "@shared/chat/message-metadata";
import { getChatById, getChatCurrentBranchId, setChatCurrentBranch } from "../chat-tree/repository";
import {
  listAllMessagesByChatId,
  listMessagesByChatId,
  type MessageRow,
} from "../messages/repository";

export interface ChatMessagesService {
  listChatMessages(chatId: string, branchId?: string | null): MynthUiMessage[];
  listAllChatMessages(chatId: string): MynthUiMessage[];
  switchChatBranch(chatId: string, branchId: string): MynthUiMessage[];
}

function toChatMessage(message: MessageRow, fallbackParentId: string | null): MynthUiMessage {
  const base = normalizeChatMessageMetadata(message.metadata, fallbackParentId);
  return {
    id: message.id,
    role: message.role,
    parts: message.parts as MynthUiMessage["parts"],
    metadata: {
      ...base,
      ...(message.siblings !== undefined
        ? { siblings: message.siblings, siblingIndex: message.siblingIndex }
        : {}),
    },
  };
}

export function createChatMessagesService(): ChatMessagesService {
  return {
    listChatMessages(chatId: string, branchId?: string | null): MynthUiMessage[] {
      const chat = getChatById(chatId);
      if (!chat) {
        throw new Error(`Chat "${chatId}" does not exist.`);
      }

      const effectiveBranchId = branchId ?? getChatCurrentBranchId(chatId);
      const rows = listMessagesByChatId(chat.id, effectiveBranchId);
      return rows.map((row, index) =>
        toChatMessage(row, index > 0 ? (rows[index - 1]?.id ?? null) : null),
      );
    },

    listAllChatMessages(chatId: string): MynthUiMessage[] {
      const chat = getChatById(chatId);
      if (!chat) {
        throw new Error(`Chat "${chatId}" does not exist.`);
      }

      return listAllMessagesByChatId(chat.id).map((row) => toChatMessage(row, row.parentId));
    },

    switchChatBranch(chatId: string, branchId: string): MynthUiMessage[] {
      setChatCurrentBranch(chatId, branchId);
      return this.listChatMessages(chatId, branchId);
    },
  };
}
