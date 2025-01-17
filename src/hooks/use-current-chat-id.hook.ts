import { useSelector } from "@xstate/store/solid";
import { tabsManager } from "../lib/tabs-manager/tabs-manager.store";
import { createEffect, createSignal } from "solid-js";

export function useCurrentChatId() {
  const [currentChatId, setCurrentChatId] = createSignal<string | null>(null);

  const activeTab = useSelector(
    tabsManager,
    (state) => state.context.activeTab
  );

  createEffect(() => {
    if (!activeTab() || !activeTab().startsWith("chat-")) {
      setCurrentChatId(null);
    }

    setCurrentChatId(activeTab().split("-")[1]);
  });

  return currentChatId;
}
