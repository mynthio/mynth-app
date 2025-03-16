import { createInfiniteQuery } from "@tanstack/solid-query";
import { GET_CHAT_BRANCH_NODES_KEYS } from "../../utils/query-keys";
import { ChatNodesResponse } from "../../../types";
import { getChatBranchNodes } from "../../api/chat-branch-nodes/get-chat-branch-nodes";
import { Accessor } from "solid-js";

export function useChatBranchNodes({
  branchId,
  afterNodeId,
}: {
  branchId: Accessor<string>;
  afterNodeId?: Accessor<string | null>;
}) {
  return createInfiniteQuery<ChatNodesResponse>(() => ({
    queryKey: GET_CHAT_BRANCH_NODES_KEYS({
      branchId: branchId,
      afterNodeId: afterNodeId,
    }),
    queryFn: ({ pageParam = null }) =>
      getChatBranchNodes(branchId(), pageParam ? String(pageParam) : undefined),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nodes[lastPage.nodes.length - 1].id : null,
    initialPageParam: null,
    getPreviousPageParam: (firstPage) => firstPage.nodes[0].id,
  }));
}
