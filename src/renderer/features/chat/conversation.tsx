import * as React from "react";

import { useChatError, useChatHistoryError, useChatMessages } from "@/features/chat/chat-context";

import { ChatMessage } from "./message";

export function Conversation() {
  const messages = useChatMessages();
  const historyError = useChatHistoryError();
  const error = useChatError();

  return (
    <div className="min-h-0 flex flex-col gap-12 w-5xl max-w-[calc(100%-4rem)] mx-auto pt-10">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Send a message to start chatting.</p>
      ) : (
        messages.map((message) => <ChatMessage key={message.id} message={message} />)
      )}

      {historyError ? (
        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {historyError}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}
    </div>
  );
}
