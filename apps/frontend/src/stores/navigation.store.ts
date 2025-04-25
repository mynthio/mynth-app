import { createStore } from "solid-js/store";

/**
 * WORKSPACE
 */
interface Workspace {
  id: string;
}

/**
 * CONTENT
 */
type ContentType = "chat" | "settings" | "ai-integrations";

interface Content {
  id: string | null;
  type: ContentType;
}

/**
 * SIDEBAR
 */
interface Sidebar {
  isOpen: boolean;
}

type NavigationStore = {
  workspace: Workspace;
  content: Content;
  sidebar: Sidebar;
};

/**
 * Navigation store
 * TODO: Save to localStorage, as we want to persist navigation state between app restarts
 */
const [navigationStore, setNavigationStore] = createStore<NavigationStore>({
  // Workspace with id `w-default` that is the default workspace created at first app launch
  // Even if user will remove it, we will fallback then to the first workspace from the list
  // But at this point we don't care :)
  workspace: {
    id: "w-default",
  },
  // `null` is default for empty/new chat
  content: { id: null, type: "chat" },
  sidebar: {
    isOpen: true,
  },
});

export { navigationStore, setNavigationStore };
