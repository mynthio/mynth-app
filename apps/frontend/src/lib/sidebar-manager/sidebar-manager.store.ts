import { createStoreWithProducer } from "@xstate/store";
import { produce } from "immer";

type SidebarContent = "chats" | "ai_integrations" | "settings";

export const sidebarManager = createStoreWithProducer(produce, {
  context: {
    isOpen: true as boolean,
    content: "chats" as SidebarContent,
    props: {} as Record<string, any>,
  },
  on: {
    open: (
      context,
      event: {
        content?: SidebarContent;
        props?: {
          page?: string;
        };
      }
    ) => {
      context.isOpen = true;
      if (event.content) {
        context.content = event.content;
      }
    },
    close: (context) => {
      context.isOpen = false;
    },
    toggle: (context, event: { content?: SidebarContent }) => {
      if (event.content) {
        if (context.content === event.content) {
          context.isOpen = !context.isOpen;
          return;
        }
        context.content = event.content;
        context.isOpen = true;
        return;
      }

      context.isOpen = !context.isOpen;
    },
    setContent: (context, event: { content: SidebarContent }) => {
      context.content = event.content;
    },
  },
});
