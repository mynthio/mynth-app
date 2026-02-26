import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { create } from "zustand";

interface ChatStoreState {
  chats: Map<string, Chat<UIMessage>>;
  getOrCreateChat: (chatId: string, apiUrl: string) => Chat<UIMessage>;
  removeChat: (chatId: string) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  chats: new Map(),
  getOrCreateChat: (chatId, apiUrl) => {
    const existing = get().chats.get(chatId);
    if (existing) return existing;

    const chat = new Chat<UIMessage>({
      id: chatId,
      transport: new DefaultChatTransport({ api: apiUrl }),
    });

    set((state) => {
      const next = new Map(state.chats);
      next.set(chatId, chat);
      return { chats: next };
    });

    return chat;
  },
  removeChat: (chatId) => {
    set((state) => {
      const next = new Map(state.chats);
      next.delete(chatId);
      return { chats: next };
    });
  },
}));
