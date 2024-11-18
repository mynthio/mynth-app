import { createContext, createSignal, JSXElement } from "solid-js";

import { Tab } from "../types/tab.type";

export const TabsManagerContext = createContext<{
  tabs: () => Map<string, Tab>;
  add: (tab: Tab) => void;
  remove: (key: string) => void;
}>();

type TabsManagerProviderProps = {
  children: JSXElement;

  value: string;
};

export const TabsManagerProvider = (props: TabsManagerProviderProps) => {
  // Create a signal to store the tabs
  // TODO: Initial value should be the tabs from the local storage
  const [tabs, setTabs] = createSignal<Map<string, Tab>>(new Map());

  return (
    <TabsManagerContext.Provider
      value={{
        tabs: tabs,
        add: (tab: Tab) => {
          setTabs((tabs) => new Map(tabs).set(tab.path, tab));
        },
        remove: (key: string) => {
          setTabs((tabs) => {
            const newTabs = new Map(tabs);
            newTabs.delete(key);
            return newTabs;
          });
        },
      }}
    >
      {props.children}
    </TabsManagerContext.Provider>
  );
};
