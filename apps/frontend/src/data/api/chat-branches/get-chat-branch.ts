import { invoke } from "@tauri-apps/api/core";
import { Branch } from "../../../types";

export const getChatBranch = async (branchId: string) => {
  return invoke<Branch | null>("get_chat_branch", {
    branchId,
  });
};
