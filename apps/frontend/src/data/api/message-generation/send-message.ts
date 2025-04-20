import { invoke } from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";
import { ChatMessagePair } from "../../../types";
/**
 * Send a message to a chat and receive a response
 *
 * @param branchId - The ID of the branch
 * @param message - The content of the user's message
 * @param onEvent - Channel to stream the AI response events
 * @returns A promise that resolves to a ChatMessagePair containing user and assistant nodes
 */
export async function sendMessage(
  branchId: string,
  message: string,
  onEvent: Channel<any>
): Promise<ChatMessagePair> {
  return invoke<ChatMessagePair>("send_message", {
    branchId,
    message,
    onEvent,
  });
}
