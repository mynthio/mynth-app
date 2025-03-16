import { invoke } from "@tauri-apps/api/core";
import { ChatNodesResponse } from "../../../types";

export const getChatBranchNodes = async (
  branchId: string,
  afterNodeId?: string | null
) => {
  return invoke<ChatNodesResponse>("get_chat_branch_nodes", {
    branchId,
    afterNodeId,
  });
};
