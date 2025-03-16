import { Accessor } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { GET_CHAT_BRANCH_KEYS } from "../../utils/query-keys";
import { getChatBranch } from "../../api/chat-branches/get-chat-branch";

interface UseChatBranchProps {
  branchId: Accessor<string>;
}

export const useChatBranch = ({ branchId }: UseChatBranchProps) => {
  return createQuery(() => ({
    queryKey: GET_CHAT_BRANCH_KEYS({ branchId }),
    queryFn: () => getChatBranch(branchId()),
  }));
};
