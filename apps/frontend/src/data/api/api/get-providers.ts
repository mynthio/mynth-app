import { invoke } from "@tauri-apps/api/core";
import { ChatNodesResponse } from "../../../types";

export const getProviders = async () => {
  console.debug("[api|getProviders]");
  return invoke<ChatNodesResponse>("get_providers");
};
