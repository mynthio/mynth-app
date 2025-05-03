import { TabBase } from "./tab-base";
import { type EmptyTab, state, pop, switchTo } from "../../tabs.store";
import { createMemo } from "solid-js";

export function EmptyTab({ tab }: { tab: EmptyTab }) {
  const isActive = createMemo(() => tab.id === state.currentTab);
  return (
    <TabBase
      tab={tab}
      tooltip={tab.title}
      isActive={isActive()}
      onClick={() => switchTo(tab.id)}
      onClose={() => pop(tab.id)}
    />
  );
}
