import { useChat } from "@ai-sdk/react";
import type { Chat } from "@ai-sdk/react";
import { useChatStore } from "../stores/chat-store";
import type { MynthUiMessage } from "../../shared/chat/message-metadata";

export function ChatRegistry() {
  const chatEntries = useChatStore((s) => s.chatEntries);

  return (
    <>
      {Array.from(chatEntries.values()).map((chat) => (
        <ChatSessionKeepAlive key={chat.id} chat={chat} />
      ))}
    </>
  );
}

function ChatSessionKeepAlive({ chat }: { chat: Chat<MynthUiMessage> }) {
  useChat({ chat });
  return null;
}
