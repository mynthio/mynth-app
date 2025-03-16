import { Accessor } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { GET_CHAT_KEYS } from "../../utils/query-keys";
import { getChat } from "../../api/chats/get-chat";

interface UseChatProps {
  chatId: Accessor<string>;
}

export const useChat = ({ chatId }: UseChatProps) => {
  return createQuery(() => ({
    queryKey: GET_CHAT_KEYS({ chatId }),
    queryFn: () => getChat(chatId()),
  }));
};
