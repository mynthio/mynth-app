import * as React from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import { create } from "zustand";

import { chatMessageMetadataSchema, type MynthUiMessage } from "../../shared/chat/message-metadata";

interface ChatStoreState {
  chatEntries: Map<string, Chat<MynthUiMessage>>;
  getOrCreateChat: (chatId: string, apiUrl: string) => Chat<MynthUiMessage>;
  removeChat: (chatId: string) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  chatEntries: new Map(),

  getOrCreateChat: (chatId, apiUrl) => {
    const existing = get().chatEntries.get(chatId);
    if (existing) return existing;

    const chat = new Chat<MynthUiMessage>({
      id: chatId,
      transport: new DefaultChatTransport<MynthUiMessage>({
        api: apiUrl,
        prepareSendMessagesRequest: ({ body, trigger, messages, messageId }) => ({
          body: { ...body, chatId, messages, trigger, messageId },
        }),
      }),
      messageMetadataSchema: chatMessageMetadataSchema,
    });

    set((state) => {
      const next = new Map(state.chatEntries);
      next.set(chatId, chat);
      return { chatEntries: next };
    });

    return chat;
  },

  removeChat: (chatId) => {
    set((state) => {
      const next = new Map(state.chatEntries);
      next.delete(chatId);
      return { chatEntries: next };
    });
  },
}));

/**
 * Subscribes to the streaming status of a single chat by chatId.
 * Returns null if the chat has never been opened (not in the store).
 * Only the subscribing component re-renders on status change.
 */
export function useChatStatus(chatId: string): ChatStatus | null {
  const chat = useChatStore((s) => s.chatEntries.get(chatId) ?? null);
  const [status, setStatus] = React.useState<ChatStatus>(() => chat?.status ?? "ready");

  React.useEffect(() => {
    if (!chat) return;
    // Sync in case the status changed between render and effect.
    setStatus(chat.status);
    return chat["~registerStatusCallback"](() => setStatus(chat.status));
  }, [chat]);

  return chat ? status : null;
}
