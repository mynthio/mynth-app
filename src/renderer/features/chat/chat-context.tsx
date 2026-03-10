import * as React from "react";
import { type Chat } from "@ai-sdk/react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { chatsApi } from "@/api/chats";

import { useChatStore } from "@/stores/chat-store";
import type { MynthUiMessage } from "@shared/chat/message-metadata";

type ChatSendMessage = Chat<MynthUiMessage>["sendMessage"];
type ChatRegenerate = Chat<MynthUiMessage>["regenerate"];

type ChatContextState = {
  modelId: string | null;
  historyError: string | null;
  editingMessageId: string | null;
  setModelId: (modelId: string | null) => void;
  sendMessage: ChatSendMessage;
  regenerateMessage: (options?: Parameters<ChatRegenerate>[0]) => ReturnType<ChatRegenerate>;
  switchBranch: (branchId: string) => Promise<void>;
  startEditingMessage: (messageId: string) => void;
  stopEditingMessage: () => void;
  submitEditedMessage: (messageId: string, text: string) => Promise<void>;
};

type ChatTransportRefs = {
  sendMessage: ChatSendMessage | null;
  regenerate: ChatRegenerate | null;
  getMessages: (() => MynthUiMessage[]) | null;
  getStatus: (() => Chat<MynthUiMessage>["status"]) | null;
  setMessages:
    | ((messages: MynthUiMessage[] | ((messages: MynthUiMessage[]) => MynthUiMessage[])) => void)
    | null;
  markTabTouched: (() => void) | null;
};

type ChatContextStoreApi = StoreApi<ChatContextState>;

const ChatContext = React.createContext<ChatContextStoreApi | null>(null);
const ChatSessionContext = React.createContext<Chat<MynthUiMessage> | null>(null);
const CHAT_STREAM_THROTTLE_MS = 50;

type ChatContextProviderProps = {
  chatId: string;
  apiUrl: string;
  initialModelId: string | null;
  enabledModelIds: readonly string[];
  children: React.ReactNode;
};

function createChatContextStore({
  chatId,
  initialModelId,
  transportRefs,
}: {
  chatId: string;
  initialModelId: string | null;
  transportRefs: ChatTransportRefs;
}): ChatContextStoreApi {
  return createStore<ChatContextState>()((set, get) => ({
    modelId: initialModelId,
    historyError: null,
    editingMessageId: null,
    setModelId: (modelId) =>
      set((current) => {
        if (current.editingMessageId !== null || current.modelId === modelId) {
          return current;
        }

        return { ...current, modelId };
      }),
    sendMessage: (message, options) => {
      const { editingMessageId, modelId: currentModelId } = get();
      if (editingMessageId !== null) {
        return Promise.resolve();
      }

      if (!transportRefs.sendMessage || !currentModelId) {
        return Promise.resolve();
      }

      transportRefs.markTabTouched?.();

      return transportRefs.sendMessage(message, {
        ...options,
        body: { ...options?.body, modelId: currentModelId },
      });
    },
    regenerateMessage: (options) => {
      const { editingMessageId, modelId: currentModelId } = get();
      if (editingMessageId !== null) {
        return Promise.resolve();
      }

      if (!transportRefs.regenerate || !currentModelId) {
        return Promise.resolve();
      }

      transportRefs.markTabTouched?.();

      return transportRefs.regenerate({
        ...options,
        body: { ...options?.body, modelId: currentModelId },
      });
    },
    switchBranch: async (branchId) => {
      if (get().editingMessageId !== null) {
        return;
      }

      if (!transportRefs.setMessages) return;
      const newMessages = await chatsApi.switchBranch(chatId, branchId);
      transportRefs.setMessages(newMessages);
    },
    startEditingMessage: (messageId) =>
      set((current) => {
        const status = transportRefs.getStatus?.() ?? "ready";
        const isBusy = status === "streaming" || status === "submitted";

        if (
          isBusy ||
          (current.editingMessageId !== null && current.editingMessageId !== messageId)
        ) {
          return current;
        }

        if (current.editingMessageId === messageId) {
          return current;
        }

        return {
          ...current,
          editingMessageId: messageId,
        };
      }),
    stopEditingMessage: () =>
      set((current) => {
        if (current.editingMessageId === null) {
          return current;
        }

        return {
          ...current,
          editingMessageId: null,
        };
      }),
    submitEditedMessage: async (messageId, text) => {
      const trimmedText = text.trim();
      const currentModelId = get().modelId;

      if (!trimmedText || !currentModelId || !transportRefs.setMessages) {
        return;
      }

      const currentMessages = transportRefs.getMessages?.() ?? [];
      const messageIndex = currentMessages.findIndex(
        (message) => message.id === messageId && message.role === "user",
      );

      if (messageIndex === -1) {
        throw new Error(`Message "${messageId}" is not available for editing.`);
      }

      const nextMessages = currentMessages.slice(0, messageIndex);
      const parentId = nextMessages.at(-1)?.id ?? null;

      set((current) => ({
        ...current,
        editingMessageId: null,
      }));

      transportRefs.setMessages(nextMessages);

      await get().sendMessage({
        text: trimmedText,
        metadata: {
          parentId,
        },
      });
    },
  }));
}

export function ChatContextProvider({
  chatId,
  apiUrl,
  initialModelId,
  enabledModelIds,
  children,
}: ChatContextProviderProps) {
  // const { markTabTouched } = useChatTabsState();
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
    getMessages: null,
    getStatus: null,
    setMessages: null,
    markTabTouched: null,
  });
  const storeRef = React.useRef<ChatContextStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createChatContextStore({
      chatId,
      initialModelId: resolveModelId(enabledModelIds, initialModelId),
      transportRefs: transportRefs.current,
    });
  }

  const store = storeRef.current;
  transportRefs.current.sendMessage = chat.sendMessage;
  transportRefs.current.regenerate = chat.regenerate;
  transportRefs.current.getMessages = () => chat.messages;
  transportRefs.current.getStatus = () => chat.status;
  transportRefs.current.setMessages = (messagesParam) => {
    chat.messages =
      typeof messagesParam === "function" ? messagesParam(chat.messages) : messagesParam;
  };
  transportRefs.current.markTabTouched = () => {
    // FIXME: placeholder
  };

  React.useEffect(() => {
    const nextModelId = resolveModelId(enabledModelIds, store.getState().modelId);

    if (store.getState().modelId !== nextModelId) {
      store.getState().setModelId(nextModelId);
    }
  }, [enabledModelIds, store]);

  React.useEffect(() => {
    let isDisposed = false;
    let prevStatus = chat.status;
    const unsubscribe = chat["~registerStatusCallback"](() => {
      const nextStatus = chat.status;
      const didFinishStreaming =
        (prevStatus === "streaming" || prevStatus === "submitted") && nextStatus === "ready";
      prevStatus = nextStatus;

      if (!didFinishStreaming) {
        return;
      }

      void chatsApi.listMessages(chatId).then((persistedMessages) => {
        if (isDisposed) {
          return;
        }

        chat.messages = persistedMessages;
      });
    });

    return () => {
      isDisposed = true;
      unsubscribe();
    };
  }, [chat, chatId]);

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

        chat.messages = persistedMessages;
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
  }, [chat, chatId, store]);

  return (
    <ChatSessionContext.Provider value={chat}>
      <ChatContext.Provider value={store}>{children}</ChatContext.Provider>
    </ChatSessionContext.Provider>
  );
}

export function useChatContext<T>(selector: (state: ChatContextState) => T): T {
  const context = React.useContext(ChatContext);

  if (!context) {
    throw new Error("ChatContext is not available");
  }

  return useStore(context, selector);
}

function useChatSession() {
  const chat = React.useContext(ChatSessionContext);

  if (!chat) {
    throw new Error("Chat session is not available");
  }

  return chat;
}

function useChatSnapshot<T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
): T {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function useChatStatusValue() {
  const chat = useChatSession();
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => chat["~registerStatusCallback"](onStoreChange),
    [chat],
  );
  const getSnapshot = React.useCallback(() => chat.status, [chat]);

  return useChatSnapshot(subscribe, getSnapshot);
}

function useLastMessageId() {
  const chat = useChatSession();
  const subscribe = React.useCallback(
    (onStoreChange: () => void) =>
      chat["~registerMessagesCallback"](onStoreChange, CHAT_STREAM_THROTTLE_MS),
    [chat],
  );
  const getSnapshot = React.useCallback(() => chat.messages.at(-1)?.id ?? null, [chat]);

  return useChatSnapshot(subscribe, getSnapshot);
}

export function useChatModelId() {
  return useChatContext((state) => state.modelId);
}

export function useSetChatModelId() {
  return useChatContext((state) => state.setModelId);
}

export function useChatMessages() {
  const chat = useChatSession();
  const subscribe = React.useCallback(
    (onStoreChange: () => void) =>
      chat["~registerMessagesCallback"](onStoreChange, CHAT_STREAM_THROTTLE_MS),
    [chat],
  );
  const getSnapshot = React.useCallback(() => chat.messages, [chat]);

  return useChatSnapshot(subscribe, getSnapshot);
}

export function useChatSendMessage() {
  return useChatContext((state) => state.sendMessage);
}

export function useChatRegenerateMessage() {
  return useChatContext((state) => state.regenerateMessage);
}

export function useChatIsStreaming() {
  return useChatStatusValue() === "streaming";
}

export function useChatIsBusy() {
  const status = useChatStatusValue();
  return status === "streaming" || status === "submitted";
}

export function useChatIsSaveMode() {
  return useChatContext((state) => state.editingMessageId !== null);
}

export function useChatIsInteractionLocked() {
  const isBusy = useChatIsBusy();
  const editingMessageId = useChatEditingMessageId();

  return isBusy || editingMessageId !== null;
}

export function useChatError() {
  const chat = useChatSession();
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => chat["~registerErrorCallback"](onStoreChange),
    [chat],
  );
  const getSnapshot = React.useCallback(() => chat.error, [chat]);

  return useChatSnapshot(subscribe, getSnapshot);
}

export function useChatHistoryError() {
  return useChatContext((state) => state.historyError);
}

export function useIsLastMessage(messageId: string) {
  return useLastMessageId() === messageId;
}

export function useIsAnimatingMessage(messageId: string, role: string) {
  const isBusy = useChatIsBusy();
  const isLastMessage = useIsLastMessage(messageId);

  return role === "assistant" && isBusy && isLastMessage;
}

export function useChatSwitchBranch() {
  return useChatContext((state) => state.switchBranch);
}

export function useChatEditingMessageId() {
  return useChatContext((state) => state.editingMessageId);
}

export function useChatStartEditingMessage() {
  return useChatContext((state) => state.startEditingMessage);
}

export function useChatStopEditingMessage() {
  return useChatContext((state) => state.stopEditingMessage);
}

export function useChatSubmitEditedMessage() {
  return useChatContext((state) => state.submitEditedMessage);
}

function resolveModelId(enabledModelIds: readonly string[], currentModelId: string | null) {
  if (currentModelId && enabledModelIds.includes(currentModelId)) {
    return currentModelId;
  }

  return enabledModelIds[0] ?? null;
}
