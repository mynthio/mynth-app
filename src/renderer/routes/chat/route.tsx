import { createFileRoute } from "@tanstack/react-router";
import { ChatLayout } from "@/features/chat/chat-layout";

export const Route = createFileRoute("/chat")({
  component: ChatLayout,
});
