import { useChat } from "@ai-sdk/react";
import type { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useChatStore } from "../stores/chat-store";

export function ChatRegistry() {
  const chats = useChatStore((s) => s.chats);

  return (
    <>
      {Array.from(chats.entries()).map(([chatId, chat]) => (
        <ChatSessionKeepAlive key={chatId} chat={chat} />
      ))}
    </>
  );
}

function ChatSessionKeepAlive({ chat }: { chat: Chat<UIMessage> }) {
  useChat({ chat });
  return null;
}
