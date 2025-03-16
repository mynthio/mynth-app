import { Match } from "solid-js";

import { Switch } from "solid-js";

import { createSignal } from "solid-js";
import { SidebarTopBar } from "./components/sidebar/sidebar-top-bar";
import { ActivitySidebar } from "./components/sidebar/activity-sidebar";
import { TreeSidebar } from "./components/sidebar/tree-sidebar";

export function ChatSidebar() {
  const [currentView, setCurrentView] = createSignal<"activity" | "tree">(
    "activity"
  );

  return (
    <>
      <SidebarTopBar
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <div class="h-[calc(100%-var(--top-bar-height))]">
        <Switch>
          <Match when={currentView() === "activity"}>
            <ActivitySidebar />
          </Match>
          <Match when={currentView() === "tree"}>
            <TreeSidebar />
          </Match>
        </Switch>
      </div>
    </>
  );
}
