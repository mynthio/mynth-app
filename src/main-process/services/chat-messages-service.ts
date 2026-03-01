import {
  normalizeChatMessageMetadata,
  type MynthUiMessage,
} from "../../shared/chat/message-metadata";
import { getChatById } from "../chat-tree/repository";
import { listMessagesByChatId, type MessageRow } from "../messages/repository";

export interface ChatMessagesService {
  listChatMessages(chatId: string, branchId?: string | null): MynthUiMessage[];
}

function toChatMessage(message: MessageRow, previousMessageId: string | null): MynthUiMessage {
  return {
    id: message.id,
    role: message.role,
    parts: message.parts as MynthUiMessage["parts"],
    metadata: normalizeChatMessageMetadata(message.metadata, message.parentId ?? previousMessageId),
  };
}

export function createChatMessagesService(): ChatMessagesService {
  return {
    listChatMessages(chatId: string, branchId?: string | null): MynthUiMessage[] {
      const chat = getChatById(chatId);
      if (!chat) {
        throw new Error(`Chat "${chatId}" does not exist.`);
      }

      const rows = listMessagesByChatId(chat.id, branchId);
      return rows.map((row, index) =>
        toChatMessage(row, index > 0 ? (rows[index - 1]?.id ?? null) : null),
      );
    },
  };
}
