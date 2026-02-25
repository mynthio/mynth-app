import { queryOptions } from "@tanstack/react-query";

import { chatsApi } from "../api/chats";
import { queryKeys } from "./keys";

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
