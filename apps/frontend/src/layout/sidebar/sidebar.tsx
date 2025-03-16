import { Match, Show, Switch } from "solid-js";
import {
  navigationStore,
  setNavigationStore,
} from "../../stores/navigation.store";
import { ChatSidebar } from "../../features/chat/sidebar";
import { createShortcut } from "@solid-primitives/keyboard";

export function Sidebar() {
  createShortcut(
    ["Meta", "B"],
    () => {
      setNavigationStore("sidebar", "isOpen", (isOpen) => !isOpen);
    },
    { preventDefault: true, requireReset: false }
  );

  return (
    <Show when={navigationStore.sidebar.isOpen}>
      <div class="w-sidebar flex-shrink-0 relative">
        <Switch>
          <Match when={navigationStore.content.type === "chat"}>
            <ChatSidebar />
          </Match>
        </Switch>
      </div>
    </Show>
  );
}
