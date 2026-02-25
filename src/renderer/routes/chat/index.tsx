import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/chat-page";

interface ChatSearchParams {
  deleteChat?: string;
  deleteFolder?: string;
  tabChatId?: string;
}

export const Route = createFileRoute("/chat/")({
  component: ChatPage,
  validateSearch: (search: Record<string, unknown>): ChatSearchParams => ({
    deleteChat: typeof search.deleteChat === "string" ? search.deleteChat : undefined,
    deleteFolder: typeof search.deleteFolder === "string" ? search.deleteFolder : undefined,
    tabChatId: typeof search.tabChatId === "string" ? search.tabChatId : undefined,
  }),
});
