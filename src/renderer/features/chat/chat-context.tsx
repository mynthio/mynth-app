import * as React from "react";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { chatsApi } from "@/api/chats";
import { useChatStore } from "@/stores/chat-store";
import type { MynthUiMessage } from "../../../shared/chat/message-metadata";

type ChatSendMessage = UseChatHelpers<MynthUiMessage>["sendMessage"];
type ChatRegenerate = UseChatHelpers<MynthUiMessage>["regenerate"];

type ChatContextState = {
  modelId: string | null;
  messages: MynthUiMessage[];
  status: ChatStatus;
  error: Error | undefined;
  historyError: string | null;
  isStreaming: boolean;
  isBusy: boolean;
  setModelId: (modelId: string | null) => void;
  sendMessage: ChatSendMessage;
  regenerateMessage: (options?: Parameters<ChatRegenerate>[0]) => ReturnType<ChatRegenerate>;
};

type ChatTransportRefs = {
  sendMessage: ChatSendMessage | null;
  regenerate: ChatRegenerate | null;
};

type ChatContextStoreApi = StoreApi<ChatContextState>;

const ChatContext = React.createContext<ChatContextStoreApi | null>(null);

type ChatContextProviderProps = {
  chatId: string;
  apiUrl: string;
  enabledModelIds: readonly string[];
  children: React.ReactNode;
};

function createChatContextStore({
  initialModelId,
  transportRefs,
}: {
  initialModelId: string | null;
  transportRefs: ChatTransportRefs;
}): ChatContextStoreApi {
  return createStore<ChatContextState>()((set, get) => ({
    modelId: initialModelId,
    messages: [],
    status: "ready",
    error: undefined,
    historyError: null,
    isStreaming: false,
    isBusy: false,
    setModelId: (modelId) =>
      set((current) => {
        if (current.modelId === modelId) {
          return current;
        }

        return { ...current, modelId };
      }),
    sendMessage: (message, options) => {
      const currentModelId = get().modelId;
      if (!transportRefs.sendMessage || !currentModelId) {
        return Promise.resolve();
      }

      return transportRefs.sendMessage(message, {
        ...options,
        body: { ...options?.body, modelId: currentModelId },
      });
    },
    regenerateMessage: (options) => {
      const currentModelId = get().modelId;
      if (!transportRefs.regenerate || !currentModelId) {
        return Promise.resolve();
      }

      return transportRefs.regenerate({
        ...options,
        body: { ...options?.body, modelId: currentModelId },
      });
    },
  }));
}

export function ChatContextProvider({
  chatId,
  apiUrl,
  enabledModelIds,
  children,
}: ChatContextProviderProps) {
  const getOrCreateChat = useChatStore((s) => s.getOrCreateChat);
  const chat = React.useMemo(
    () => getOrCreateChat(chatId, apiUrl),
    // apiUrl is stable once the server is ready (determined at mount time).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId],
  );

  const transportRefs = React.useRef<ChatTransportRefs>({
    sendMessage: null,
    regenerate: null,
  });
  const storeRef = React.useRef<ChatContextStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createChatContextStore({
      initialModelId: enabledModelIds[0] ?? null,
      transportRefs: transportRefs.current,
    });
  }

  const store = storeRef.current;
  const { messages, sendMessage, regenerate, setMessages, status, error } = useChat<MynthUiMessage>(
    { chat },
  );

  transportRefs.current.sendMessage = sendMessage;
  transportRefs.current.regenerate = regenerate;

  React.useEffect(() => {
    const nextModelId = resolveModelId(enabledModelIds, store.getState().modelId);

    if (store.getState().modelId !== nextModelId) {
      store.getState().setModelId(nextModelId);
    }
  }, [enabledModelIds, store]);

  React.useEffect(() => {
    const isStreaming = status === "streaming";
    const isBusy = isStreaming || status === "submitted";

    store.setState((current) => {
      if (
        current.messages === messages &&
        current.status === status &&
        current.error === error &&
        current.isStreaming === isStreaming &&
        current.isBusy === isBusy
      ) {
        return current;
      }

      return {
        ...current,
        messages,
        status,
        error,
        isStreaming,
        isBusy,
      };
    });
  }, [error, messages, status, store]);

  React.useEffect(() => {
    let isDisposed = false;

    // If the Chat already has messages (e.g. returning to a tab that was
    // already loaded), skip re-loading so we don't lose streaming state.
    if (chat.messages.length > 0) {
      return;
    }

    store.setState((current) => {
      if (current.historyError === null) {
        return current;
      }

      return { ...current, historyError: null };
    });

    void chatsApi
      .listMessages(chatId)
      .then((persistedMessages) => {
        if (isDisposed) {
          return;
        }

        setMessages(persistedMessages);
      })
      .catch((loadError) => {
        if (isDisposed) {
          return;
        }

        const message =
          loadError instanceof Error && loadError.message.trim()
            ? loadError.message
            : "Failed to load chat messages.";

        store.setState((current) => {
          if (current.historyError === message) {
            return current;
          }

          return { ...current, historyError: message };
        });
      });

    return () => {
      isDisposed = true;
    };
  }, [chat, chatId, setMessages, store]);

  return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
}

export function useChatContext<T>(selector: (state: ChatContextState) => T): T {
  const context = React.useContext(ChatContext);

  if (!context) {
    throw new Error("ChatContext is not available");
  }

  return useStore(context, selector);
}

export function useChatModelId() {
  return useChatContext((state) => state.modelId);
}

export function useSetChatModelId() {
  return useChatContext((state) => state.setModelId);
}

export function useChatMessages() {
  return useChatContext((state) => state.messages);
}

export function useChatSendMessage() {
  return useChatContext((state) => state.sendMessage);
}

export function useChatRegenerateMessage() {
  return useChatContext((state) => state.regenerateMessage);
}

export function useChatIsStreaming() {
  return useChatContext((state) => state.isStreaming);
}

export function useChatIsBusy() {
  return useChatContext((state) => state.isBusy);
}

export function useChatError() {
  return useChatContext((state) => state.error);
}

export function useChatHistoryError() {
  return useChatContext((state) => state.historyError);
}

function resolveModelId(enabledModelIds: readonly string[], currentModelId: string | null) {
  if (currentModelId && enabledModelIds.includes(currentModelId)) {
    return currentModelId;
  }

  return enabledModelIds[0] ?? null;
}
