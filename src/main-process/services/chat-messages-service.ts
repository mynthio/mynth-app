import { normalizeChatMessageMetadata, type MynthUiMessage } from "@shared/chat/message-metadata";
import { type EditMessageBehavior } from "@shared/ipc";
import { createUuidV7 } from "../db/uuidv7";
import { getChatById, getChatCurrentBranchId, setChatCurrentBranch } from "../chat-tree/repository";
import {
  getMessageById,
  listAllMessagesByChatId,
  listMessagesByChatId,
  type MessageRow,
  upsertMessage,
} from "../messages/repository";

export interface ChatMessagesService {
  listChatMessages(chatId: string, branchId?: string | null): MynthUiMessage[];
  listAllChatMessages(chatId: string): MynthUiMessage[];
  switchChatBranch(chatId: string, branchId: string): MynthUiMessage[];
  editMessage(messageId: string, text: string, behavior: EditMessageBehavior): MynthUiMessage[];
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

    editMessage(messageId: string, text: string, behavior: EditMessageBehavior): MynthUiMessage[] {
      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new Error("Message text cannot be empty.");
      }

      const originalMessage = getMessageById(messageId);
      if (!originalMessage) {
        throw new Error(`Message "${messageId}" does not exist.`);
      }

      const chat = getChatById(originalMessage.chatId);
      if (!chat) {
        throw new Error(`Chat "${originalMessage.chatId}" does not exist.`);
      }

      if (originalMessage.role !== "assistant" && originalMessage.role !== "user") {
        throw new Error(`Message "${messageId}" is not editable.`);
      }

      if (behavior === "overwrite") {
        upsertMessage({
          id: originalMessage.id,
          chatId: chat.id,
          parentId: originalMessage.parentId,
          role: originalMessage.role,
          parts: [
            {
              type: "text",
              text: trimmedText,
            },
          ],
          metadata: {
            ...originalMessage.metadata,
            parentId: originalMessage.parentId,
          },
        });

        const currentBranchId = getChatCurrentBranchId(chat.id);
        return this.listChatMessages(chat.id, currentBranchId ?? undefined);
      }

      const nextMessageId = createUuidV7();
      const parentId = originalMessage.parentId;

      upsertMessage({
        id: nextMessageId,
        chatId: chat.id,
        parentId,
        role: originalMessage.role,
        parts: [
          {
            type: "text",
            text: trimmedText,
          },
        ],
        metadata: { parentId },
      });

      setChatCurrentBranch(chat.id, nextMessageId);

      return this.listChatMessages(chat.id, nextMessageId);
    },
  };
}
