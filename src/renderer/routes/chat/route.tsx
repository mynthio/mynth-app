import { createFileRoute } from "@tanstack/react-router";
import { ChatLayout } from "@/features/chat/chat-layout";

export interface ChatSearchParams {
  deleteChat?: string;
  deleteFolder?: string;
  tabChatId?: string;
}

export const Route = createFileRoute("/chat")({
  component: ChatLayout,
  validateSearch: (search: Record<string, unknown>): ChatSearchParams => ({
    deleteChat: typeof search.deleteChat === "string" ? search.deleteChat : undefined,
    deleteFolder: typeof search.deleteFolder === "string" ? search.deleteFolder : undefined,
    tabChatId: typeof search.tabChatId === "string" ? search.tabChatId : undefined,
  }),
});
