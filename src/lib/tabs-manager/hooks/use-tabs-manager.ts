import { useContext } from "solid-js";
import { TabsManagerContext } from "../context/tabs-manager-context";
import { useNavigate } from "@solidjs/router";
import { Tab } from "../types/tab.type";

export const useTabsManager = () => {
  const navigate = useNavigate();

  const tabsContext = useContext(TabsManagerContext);

  if (!tabsContext) {
    throw new Error("useTabs must be used within a TabsProvider");
  }

  const openTab = (tab: Tab): void => {
    tabsContext.add(tab);
    navigate(tab.path);
  };

  return {
    ...tabsContext,
    openTab,
  } as const;
};
