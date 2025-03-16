import { invoke } from "@tauri-apps/api/core";
import { Chat } from "../../../types";

export const getChat = async (chatId: string) => {
  return invoke<Chat | null>("get_chat", {
    chatId,
  });
};
