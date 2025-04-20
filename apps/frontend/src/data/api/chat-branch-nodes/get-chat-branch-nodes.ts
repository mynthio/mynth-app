import { invoke } from "@tauri-apps/api/core";
import { ChatNodesResponse } from "../../../types";

export const getChatBranchNodes = async (
  branchId: string,
  afterNodeId?: string | null
) => {
  console.debug(
    "[api|getChatBranchNodes]",
    `Branch ID: ${branchId}`,
    `After Node ID: ${afterNodeId}`
  );
  return invoke<ChatNodesResponse>("get_chat_branch_nodes", {
    branchId,
    afterNodeId,
  });
};
