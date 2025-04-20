import { Match } from "solid-js";

import { Switch } from "solid-js";
import { SettingsSidebar } from "../../features/settings/sidebar";

import { ChatSidebar } from "../../features/chat/sidebar";
import { navigationStore } from "../../stores/navigation.store";

export function SidebarContent() {
  return (
    <div class="w-full h-full flex-1 relative border-l border-background pl-8px">
      <Switch>
        <Match when={navigationStore.content.type === "chat"}>
          <ChatSidebar />
        </Match>
        <Match when={navigationStore.content.type === "settings"}>
          <SettingsSidebar />
        </Match>
      </Switch>
    </div>
  );
}
