import { createStoreWithProducer } from "@xstate/store";
import { produce } from "immer";
import superjson from "superjson";

type Tab = {
  id: string;

  title: string;

  type: "chat" | "empty";
  chatId?: string;
};

const LOCAL_STORAGE_KEY = "mynth:tabs-manager:context";

export const tabsManager = createStoreWithProducer(produce, {
  // TODO: read from localStorage
  // https://github.com/flightcontrolhq/superjson
  context: localStorage.getItem(LOCAL_STORAGE_KEY)
    ? superjson.parse<{
        tabs: Map<string, Tab>;
        activeTab: string;
      }>(localStorage.getItem(LOCAL_STORAGE_KEY) as string)
    : {
        tabs: new Map<string, Tab>([
          ["empty-tab", { id: "empty-tab", type: "empty", title: "Empty Tab" }],
        ]),
        activeTab: "empty-tab",
      },
  on: {
    addTab: (context, event: { id: string; title: string; chatId: string }) => {
      context.tabs.set(event.id, {
        id: event.id,
        type: "chat",
        chatId: event.chatId,
        title: event.title,
      });
      context.activeTab = event.id;
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
    openTab: (
      context,
      event: { id: string; title: string; component: any }
    ) => {
      context.tabs.set(event.id, {
        id: event.id,
        type: event.component,
        title: event.title,
      });
      context.activeTab = event.id;
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
    closeTab: (context, event: { id: string }) => {
      context.tabs.delete(event.id);
      if (context.activeTab === event.id) {
        if (context.tabs.size > 0) {
          context.activeTab = Array.from(context.tabs.keys())[0];
        } else {
          context.tabs.set("empty-tab", {
            id: "empty-tab",
            type: "empty",
            title: "Empty Tab",
          });
          context.activeTab = "empty-tab";
        }
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
    closeActiveTab: (context) => {
      if (context.activeTab) {
        context.tabs.delete(context.activeTab);
        if (context.tabs.size > 0) {
          context.activeTab = Array.from(context.tabs.keys())[0];
        } else {
          context.tabs.set("empty-tab", {
            id: "empty-tab",
            type: "empty",
            title: "Empty Tab",
          });
          context.activeTab = "empty-tab";
        }
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
    setActiveTab: (context, event: { id: string }) => {
      context.activeTab = event.id;
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
    nextTab: (context) => {
      const tabs = Array.from(context.tabs.values());
      const currentIndex = tabs.findIndex(
        (tab) => tab.id === context.activeTab
      );
      const nextIndex = currentIndex + 1;
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        context.activeTab = nextTab.id;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
    previousTab: (context) => {
      const tabs = Array.from(context.tabs.values());
      const currentIndex = tabs.findIndex(
        (tab) => tab.id === context.activeTab
      );
      const previousIndex = currentIndex - 1;
      const previousTab = tabs[previousIndex];
      if (previousTab) {
        context.activeTab = previousTab.id;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, superjson.stringify(context));
    },
  },
});
