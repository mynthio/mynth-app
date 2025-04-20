import { invoke } from "@tauri-apps/api/core";
import { ChatFolder } from "../../../types";

export const getChatFolder = async (folderId: string) => {
  return invoke<ChatFolder | null>("get_chat_folder", {
    folderId,
  });
};
