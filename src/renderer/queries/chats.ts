import { queryOptions } from "@tanstack/react-query";

import { chatsApi } from "../api/chats";
import { queryKeys } from "./keys";

export const CURRENT_BRANCH_QUERY_KEY = "__current__";

export function getChatQueryOptions(chatId: string | null, options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: queryKeys.chats.byId(chatId ?? ""),
    queryFn: () => {
      if (!chatId) {
        throw new Error("Chat ID is required.");
      }

      return chatsApi.get(chatId);
    },
    enabled: options?.enabled ?? Boolean(chatId),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function getChatMessagesQueryOptions(
  chatId: string | null,
  branchId?: string | null,
  options?: { enabled?: boolean },
) {
  return queryOptions({
    queryKey: queryKeys.chats.messages(chatId ?? "", branchId ?? CURRENT_BRANCH_QUERY_KEY),
    queryFn: () => {
      if (!chatId) {
        throw new Error("Chat ID is required.");
      }

      return chatsApi.listMessages(chatId, branchId);
    },
    enabled: options?.enabled ?? Boolean(chatId),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function getAllChatMessagesQueryOptions(
  chatId: string | null,
  options?: { enabled?: boolean },
) {
  return queryOptions({
    queryKey: queryKeys.chats.allMessages(chatId ?? ""),
    queryFn: () => {
      if (!chatId) {
        throw new Error("Chat ID is required.");
      }

      return chatsApi.listAllMessages(chatId);
    },
    enabled: options?.enabled ?? Boolean(chatId),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
