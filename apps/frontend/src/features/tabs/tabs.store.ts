import { createStore } from "solid-js/store";

const EMPTY_TAB_ID = "empty" as const;

const EMPTY_TAB: EmptyTab = {
  id: EMPTY_TAB_ID,
  type: "empty",
  title: "New Tab",
  state: "idle",
};

type TabType = "chat" | "empty";

type TabState = "idle" | "loading" | "error";

type BaseTab = {
  id: string;
  type: TabType;

  title: string;

  state: TabState;
};

type ChatTab = BaseTab & {
  data: {
    chatId: string;
  };
};

type EmptyTab = BaseTab & {
  id: typeof EMPTY_TAB_ID;
};

type Tab = ChatTab | EmptyTab;

type TabsStore = {
  currentTab: string;

  tabs: Tab[];
};

const [state, setState] = createStore<TabsStore>({
  currentTab: EMPTY_TAB_ID,
  tabs: [EMPTY_TAB],
});

const pop = (id: string) => {
  setState("tabs", (tabs) => {
    const newTabs = tabs.filter((tab) => tab.id !== id);
    if (newTabs.length === 0) {
      return [EMPTY_TAB];
    }
    return newTabs;
  });

  if (id === state.currentTab) {
    next();
  }
};

const push = (tab: Tab) => {
  if (tab.type === "chat") {
    if (
      state.tabs.find(
        (t) => t.type === "chat" && t.data.chatId === tab.data.chatId
      )
    ) {
      setState("currentTab", tab.id);
      return;
    }
  }

  setState("tabs", (tabs) => [...tabs, tab]);
  setState("currentTab", tab.id);
};

const pushEmpty = () => {
  push(EMPTY_TAB);
};

const next = () => {
  setState("currentTab", (currentTab) => {
    const index = state.tabs.findIndex((t) => t.id === currentTab);
    // If not tab, switch to first one
    return state.tabs[index + 1]?.id || state.tabs[0]?.id || EMPTY_TAB_ID;
  });
};

const switchTo = (id: string) => {
  setState("currentTab", id);
};

export {
  EMPTY_TAB_ID,
  type ChatTab,
  type EmptyTab,
  type Tab,
  state,
  push,
  pushEmpty,
  pop,
  switchTo,
  next,
};
