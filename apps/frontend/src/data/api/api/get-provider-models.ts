import { invoke } from "@tauri-apps/api/core";
import { ChatNodesResponse } from "../../../types";

export const getProviderModels = async (providerId: string) => {
  console.debug("[api|getProviderModels]");
  return invoke<any>("get_provider_models", { providerId });
};
