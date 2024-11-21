import { createMemo, useContext } from "solid-js";
import { TabsManagerContext } from "../context/tabs-manager-context";
import { useLocation, useNavigate } from "@solidjs/router";
import { Tab } from "../types/tab.type";

export const useTabsManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = createMemo(() => location.pathname);

  const tabsContext = useContext(TabsManagerContext);

  if (!tabsContext) {
    throw new Error("useTabs must be used within a TabsProvider");
  }

  const openTab = (tab: Tab): void => {
    tabsContext.add(tab);
    navigate(tab.path);
  };

  const closeTab = (path: string): void => {
    const pathsArray = Array.from(tabsContext.tabs().keys());
    const currentIndex = pathsArray.indexOf(path);

    // Store next/previous paths before removing
    const nextOrPreviousPath =
      pathsArray[currentIndex + 1] || pathsArray[currentIndex - 1];

    // Remove the tab
    tabsContext.remove(path);

    // Only navigate if we're closing the current tab
    if (pathname() === path) {
      if (nextOrPreviousPath) {
        navigate(nextOrPreviousPath);
      } else {
        navigate("/");
      }
    }
  };

  const openEmptyTab = () => {
    openTab({
      path: `/new`,
      title: "New Tab",
      data: {},
    });
  };

  return {
    ...tabsContext,
    openTab,
    closeTab,
    openEmptyTab,
  } as const;
};
