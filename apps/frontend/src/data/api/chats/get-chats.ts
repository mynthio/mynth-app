import { invoke } from "@tauri-apps/api/core";
import { Chat } from "../../../types";

export const getChats = async (workspaceId: string) => {
  return invoke<Chat[]>("get_chats", {
    workspaceId,
  });
};
