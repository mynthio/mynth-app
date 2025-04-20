import { invoke } from "@tauri-apps/api/core";

export const deleteChatFolder = async (folderId: string) => {
  return invoke<void>("delete_chat_folder", {
    folderId,
  });
};
