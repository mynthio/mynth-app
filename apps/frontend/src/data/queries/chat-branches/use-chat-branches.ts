import { Accessor } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { GET_CHAT_BRANCHES_KEYS } from "../../utils/query-keys";
import { getChatBranches } from "../../api/chat-branches/get-chat-branches";

interface UseChatBranchesProps {
  chatId: Accessor<string>;
}

export const useChatBranches = ({ chatId }: UseChatBranchesProps) => {
  return createQuery(() => ({
    queryKey: GET_CHAT_BRANCHES_KEYS({ chatId }),
    queryFn: () => getChatBranches(chatId()),
  }));
};
