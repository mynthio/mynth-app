import { invoke } from "@tauri-apps/api/core";
import { ChatBranch } from "../../../types/models/chat";

export function getChatBranches(chatId: string) {
  return invoke<ChatBranch[]>("get_chat_branches", { chatId });
}
