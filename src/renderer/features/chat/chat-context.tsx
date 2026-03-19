import * as React from "react";
import { type Chat } from "@ai-sdk/react";
import { readUIMessageStream } from "ai";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { messagesApi } from "@/api/messages";

import { createChatTransport, useChatStore } from "@/stores/chat-store";
import { normalizeChatMessageMetadata, type MynthUiMessage } from "@shared/chat/message-metadata";
import type { EditMessageBehavior } from "@shared/ipc";

type ChatSendMessage = Chat<MynthUiMessage>["sendMessage"];
type ChatRegenerate = Chat<MynthUiMessage>["regenerate"];

type ChatContextState = {
  modelId: string | null;
  historyError: string | null;
  editingMessageId: string | null;
  continuingMessageId: string | null;
  continuationError: string | null;
  setModelId: (modelId: string | null) => void;
  sendMessage: ChatSendMessage;
  stopGeneration: () => Promise<void>;
  regenerateMessage: (options?: Parameters<ChatRegenerate>[0]) => ReturnType<ChatRegenerate>;
  continueMessage: (messageId: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  startEditingMessage: (messageId: string) => void;
  stopEditingMessage: () => void;
  submitEditedMessage: (
    messageId: string,
    text: string,
    behavior: EditMessageBehavior,
  ) => Promise<void>;
};

type ChatTransportRefs = {
  sendMessage: ChatSendMessage | null;
  regenerate: ChatRegenerate | null;
  stopChat: (() => Promise<void>) | null;
  stopContinuation: (() => void) | null;
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
  apiUrl,
  chatId,
  initialModelId,
  transportRefs,
}: {
  apiUrl: string;
  chatId: string;
  initialModelId: string | null;
  transportRefs: ChatTransportRefs;
}): ChatContextStoreApi {
  return createStore<ChatContextState>()((set, get) => ({
    modelId: initialModelId,
    historyError: null,
    editingMessageId: null,
    continuingMessageId: null,
    continuationError: null,
    setModelId: (modelId) =>
      set((current) => {
        if (
          current.editingMessageId !== null ||
          current.continuingMessageId !== null ||
          current.modelId === modelId
        ) {
          return current;
        }

        return { ...current, modelId };
      }),
    stopGeneration: async () => {
      const { continuingMessageId } = get();

      if (continuingMessageId !== null) {
        transportRefs.stopContinuation?.();
        return;
      }

      await transportRefs.stopChat?.();
    },
    sendMessage: (message, options) => {
      const {
        editingMessageId,
        continuingMessageId,
        modelId: currentModelId,
        continuationError,
      } = get();
      if (editingMessageId !== null) {
        return Promise.resolve();
      }

      if (continuingMessageId !== null) {
        return Promise.resolve();
      }

      if (!transportRefs.sendMessage || !currentModelId) {
        return Promise.resolve();
      }

      if (continuationError !== null) {
        set((current) => ({ ...current, continuationError: null }));
      }

      transportRefs.markTabTouched?.();

      return transportRefs.sendMessage(message, {
        ...options,
        body: { ...options?.body, modelId: currentModelId },
      });
    },
    regenerateMessage: (options) => {
      const {
        editingMessageId,
        continuingMessageId,
        modelId: currentModelId,
        continuationError,
      } = get();
      if (editingMessageId !== null) {
        return Promise.resolve();
      }

      if (continuingMessageId !== null) {
        return Promise.resolve();
      }

      if (!transportRefs.regenerate || !currentModelId) {
        return Promise.resolve();
      }

      if (continuationError !== null) {
        set((current) => ({ ...current, continuationError: null }));
      }

      transportRefs.markTabTouched?.();

      return transportRefs.regenerate({
        ...options,
        body: { ...options?.body, modelId: currentModelId },
      });
    },
    continueMessage: async (messageId) => {
      const {
        editingMessageId,
        continuingMessageId,
        modelId: currentModelId,
        continuationError,
      } = get();
      const status = transportRefs.getStatus?.() ?? "ready";
      const isBusy = status === "streaming" || status === "submitted";

      if (editingMessageId !== null || continuingMessageId !== null || isBusy) {
        return;
      }

      if (!currentModelId || !transportRefs.getMessages || !transportRefs.setMessages) {
        return;
      }

      const currentMessages = transportRefs.getMessages();
      const baselineMessages = structuredClone(currentMessages) as MynthUiMessage[];
      const messageIndex = baselineMessages.findIndex((message) => message.id === messageId);

      if (messageIndex === -1) {
        set((current) => ({
          ...current,
          continuationError: `Message "${messageId}" is not available for continuation.`,
        }));
        return;
      }

      const targetMessage = baselineMessages[messageIndex];
      if (!targetMessage || targetMessage.role !== "assistant") {
        set((current) => ({
          ...current,
          continuationError: `Message "${messageId}" is not available for continuation.`,
        }));
        return;
      }

      if (continuationError !== null) {
        set((current) => ({ ...current, continuationError: null }));
      }

      set((current) => ({
        ...current,
        continuingMessageId: messageId,
        continuationError: null,
      }));

      transportRefs.markTabTouched?.();

      const requestMessages = baselineMessages.slice(0, messageIndex + 1);
      const continuationTransport = createChatTransport(apiUrl, chatId);
      const continuationAbortController = new AbortController();
      let lastStreamedContinuationMessage: MynthUiMessage | null = null;
      let didStreamFinish = false;

      transportRefs.stopContinuation = () => {
        continuationAbortController.abort();
      };

      try {
        const stream = await continuationTransport.sendMessages({
          abortSignal: continuationAbortController.signal,
          body: {
            mode: "continue-message",
            modelId: currentModelId,
            targetMessageId: messageId,
          },
          chatId,
          messageId: undefined,
          messages: requestMessages,
          trigger: "submit-message",
        });

        for await (const streamedMessage of readUIMessageStream<MynthUiMessage>({
          message: structuredClone(targetMessage) as MynthUiMessage,
          stream,
        })) {
          const mergedMessage = mergeContinuationMessage(targetMessage, streamedMessage);
          lastStreamedContinuationMessage = structuredClone(mergedMessage) as MynthUiMessage;

          React.startTransition(() => {
            transportRefs.setMessages?.(
              replaceMessageById(
                baselineMessages,
                messageId,
                structuredClone(mergedMessage) as MynthUiMessage,
              ),
            );
          });
        }

        didStreamFinish = true;

        const persistedMessages = await messagesApi.listMessages(chatId);
        React.startTransition(() => {
          transportRefs.setMessages?.(persistedMessages);
        });

        set((current) => ({
          ...current,
          continuingMessageId: null,
          continuationError: null,
        }));
      } catch (error) {
        if (isAbortError(error)) {
          const optimisticMessages = lastStreamedContinuationMessage
            ? replaceMessageById(
                baselineMessages,
                messageId,
                structuredClone(lastStreamedContinuationMessage) as MynthUiMessage,
              )
            : baselineMessages;

          React.startTransition(() => {
            transportRefs.setMessages?.(optimisticMessages);
          });

          const persistedMessages = await syncContinuationMessagesAfterAbort({
            chatId,
            fallbackMessages: optimisticMessages,
            messageId,
            originalMessage: targetMessage,
          });

          React.startTransition(() => {
            transportRefs.setMessages?.(persistedMessages);
          });

          set((current) => ({
            ...current,
            continuingMessageId: null,
            continuationError: null,
          }));

          return;
        }

        if (!didStreamFinish) {
          React.startTransition(() => {
            transportRefs.setMessages?.(baselineMessages);
          });
        }

        set((current) => ({
          ...current,
          continuingMessageId: null,
          continuationError: getErrorMessage(error, "Failed to continue the message."),
        }));
      } finally {
        transportRefs.stopContinuation = null;
      }
    },
    switchBranch: async (branchId) => {
      const { editingMessageId, continuingMessageId } = get();
      if (editingMessageId !== null || continuingMessageId !== null) {
        return;
      }

      if (!transportRefs.setMessages) return;
      const newMessages = await messagesApi.switchBranch(chatId, branchId);
      transportRefs.setMessages(newMessages);
    },
    startEditingMessage: (messageId) =>
      set((current) => {
        const status = transportRefs.getStatus?.() ?? "ready";
        const isBusy = status === "streaming" || status === "submitted";

        if (
          isBusy ||
          current.continuingMessageId !== null ||
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
    submitEditedMessage: async (messageId, text, behavior) => {
      const trimmedText = text.trim();

      if (!trimmedText || !transportRefs.setMessages) {
        return;
      }

      const currentMessages = transportRefs.getMessages?.() ?? [];
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);

      if (messageIndex === -1) {
        throw new Error(`Message "${messageId}" is not available for editing.`);
      }

      const message = currentMessages[messageIndex];
      if (!message || (message.role !== "user" && message.role !== "assistant")) {
        throw new Error(`Message "${messageId}" is not available for editing.`);
      }

      const currentModelId = get().modelId;
      if (message.role === "user" && !currentModelId) {
        return;
      }

      set((current) => ({
        ...current,
        editingMessageId: null,
      }));

      const persistedMessages = await messagesApi.editMessage(messageId, trimmedText, behavior);
      transportRefs.setMessages(persistedMessages);

      if (message.role === "assistant" || behavior !== "branch") {
        return;
      }

      await get().regenerateMessage();
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
    stopChat: null,
    stopContinuation: null,
    getMessages: null,
    getStatus: null,
    setMessages: null,
    markTabTouched: null,
  });
  const storeRef = React.useRef<ChatContextStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createChatContextStore({
      chatId,
      apiUrl,
      initialModelId: resolveModelId(enabledModelIds, initialModelId),
      transportRefs: transportRefs.current,
    });
  }

  const store = storeRef.current;
  transportRefs.current.sendMessage = chat.sendMessage;
  transportRefs.current.regenerate = chat.regenerate;
  transportRefs.current.stopChat = chat.stop;
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

      void messagesApi.listMessages(chatId).then((persistedMessages) => {
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

    void messagesApi
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

export function useChatStop() {
  return useChatContext((state) => state.stopGeneration);
}

export function useChatRegenerateMessage() {
  return useChatContext((state) => state.regenerateMessage);
}

export function useChatContinueMessage() {
  return useChatContext((state) => state.continueMessage);
}

function useChatTransportBusy() {
  const status = useChatStatusValue();
  return status === "streaming" || status === "submitted";
}

export function useChatIsStreaming() {
  return useChatStatusValue() === "streaming";
}

export function useChatCanStop() {
  const isTransportBusy = useChatTransportBusy();
  const continuingMessageId = useChatContext((state) => state.continuingMessageId);

  return isTransportBusy || continuingMessageId !== null;
}

export function useChatIsBusy() {
  const isTransportBusy = useChatTransportBusy();
  const continuingMessageId = useChatContext((state) => state.continuingMessageId);

  return isTransportBusy || continuingMessageId !== null;
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
  const continuationError = useChatContext((state) => state.continuationError);
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => chat["~registerErrorCallback"](onStoreChange),
    [chat],
  );
  const getSnapshot = React.useCallback(() => chat.error, [chat]);
  const chatError = useChatSnapshot(subscribe, getSnapshot);

  return React.useMemo(() => {
    if (continuationError) {
      return new Error(continuationError);
    }

    return chatError;
  }, [chatError, continuationError]);
}

export function useChatHistoryError() {
  return useChatContext((state) => state.historyError);
}

export function useIsLastMessage(messageId: string) {
  return useLastMessageId() === messageId;
}

export function useIsAnimatingMessage(messageId: string, role: string) {
  const isTransportBusy = useChatTransportBusy();
  const isLastMessage = useIsLastMessage(messageId);
  const continuingMessageId = useChatContext((state) => state.continuingMessageId);

  return (
    role === "assistant" &&
    ((continuingMessageId !== null && continuingMessageId === messageId) ||
      (continuingMessageId === null && isTransportBusy && isLastMessage))
  );
}

export function useChatSwitchBranch() {
  return useChatContext((state) => state.switchBranch);
}

export function useChatEditingMessageId() {
  return useChatContext((state) => state.editingMessageId);
}

export function useChatContinuingMessageId() {
  return useChatContext((state) => state.continuingMessageId);
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

function replaceMessageById(
  messages: readonly MynthUiMessage[],
  messageId: string,
  nextMessage: MynthUiMessage,
) {
  return messages.map((message) => (message.id === messageId ? nextMessage : message));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function syncContinuationMessagesAfterAbort({
  chatId,
  fallbackMessages,
  messageId,
  originalMessage,
}: {
  chatId: string;
  fallbackMessages: MynthUiMessage[];
  messageId: string;
  originalMessage: MynthUiMessage;
}) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const persistedMessages = await messagesApi.listMessages(chatId).catch(() => null);

    if (persistedMessages) {
      const persistedMessage = persistedMessages.find((message) => message.id === messageId);

      if (
        persistedMessage &&
        !areMessagePartsEqual(persistedMessage.parts, originalMessage.parts)
      ) {
        return persistedMessages;
      }
    }

    await wait(60 * (attempt + 1));
  }

  return fallbackMessages;
}

function areMessagePartsEqual(
  left: readonly MynthUiMessage["parts"][number][],
  right: readonly MynthUiMessage["parts"][number][],
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function mergeContinuationMessage(
  originalMessage: MynthUiMessage,
  streamedMessage: MynthUiMessage,
): MynthUiMessage {
  const mergedMetadata = normalizeChatMessageMetadata(
    {
      ...(originalMessage.metadata ?? {}),
      ...(streamedMessage.metadata ?? {}),
    },
    originalMessage.metadata?.parentId ?? null,
  );

  return {
    ...streamedMessage,
    parts: mergeContinuationParts(originalMessage.parts, streamedMessage.parts),
    metadata: mergedMetadata,
  };
}

function mergeContinuationParts(
  originalParts: MynthUiMessage["parts"],
  responseParts: MynthUiMessage["parts"],
): MynthUiMessage["parts"] {
  const continuationSuffix = extractContinuationSuffixParts(originalParts, responseParts);

  if (continuationSuffix.length === 0) {
    return structuredClone(originalParts) as MynthUiMessage["parts"];
  }

  const mergedParts = structuredClone(originalParts) as MynthUiMessage["parts"];
  const lastOriginalTextIndex = findLastTextPartIndex(mergedParts);
  const firstSuffixTextIndex = findFirstTextPartIndex(continuationSuffix);

  if (lastOriginalTextIndex === -1 || firstSuffixTextIndex === -1) {
    return [...mergedParts, ...continuationSuffix];
  }

  const suffixPrefixParts = continuationSuffix.slice(0, firstSuffixTextIndex);
  const suffixFirstTextPart = continuationSuffix[firstSuffixTextIndex];
  const suffixRemainingParts = continuationSuffix.slice(firstSuffixTextIndex + 1);
  const originalLastTextPart = mergedParts[lastOriginalTextIndex];

  if (
    !suffixFirstTextPart ||
    suffixFirstTextPart.type !== "text" ||
    !originalLastTextPart ||
    originalLastTextPart.type !== "text"
  ) {
    return [...mergedParts, ...continuationSuffix];
  }

  const nextLastTextPart = {
    ...originalLastTextPart,
    text: `${originalLastTextPart.text}${suffixFirstTextPart.text}`,
    providerMetadata: suffixFirstTextPart.providerMetadata ?? originalLastTextPart.providerMetadata,
    state: suffixFirstTextPart.state ?? originalLastTextPart.state,
  };

  mergedParts[lastOriginalTextIndex] = nextLastTextPart;

  return [...mergedParts, ...suffixPrefixParts, ...suffixRemainingParts];
}

function extractContinuationSuffixParts(
  originalParts: MynthUiMessage["parts"],
  responseParts: MynthUiMessage["parts"],
): MynthUiMessage["parts"] {
  if (!startsWithParts(responseParts, originalParts)) {
    return structuredClone(responseParts) as MynthUiMessage["parts"];
  }

  return structuredClone(responseParts.slice(originalParts.length)) as MynthUiMessage["parts"];
}

function startsWithParts(
  candidateParts: readonly MynthUiMessage["parts"][number][],
  prefixParts: readonly MynthUiMessage["parts"][number][],
) {
  if (candidateParts.length < prefixParts.length) {
    return false;
  }

  return prefixParts.every(
    (part, index) => JSON.stringify(candidateParts[index]) === JSON.stringify(part),
  );
}

function findFirstTextPartIndex(parts: readonly MynthUiMessage["parts"][number][]) {
  return parts.findIndex((part) => part.type === "text");
}

function findLastTextPartIndex(parts: readonly MynthUiMessage["parts"][number][]) {
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (parts[index]?.type === "text") {
      return index;
    }
  }

  return -1;
}
