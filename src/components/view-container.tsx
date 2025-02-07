import { Match, Switch } from "solid-js";
import { viewManager } from "../stores/view-manager.store";
import RootLayout from "../layouts/root-layout";
import { DialogManager } from "./dialogs/dialog-manager";

export function ViewContainer() {
  return (
    <Switch>
      <Match when={viewManager.activeView() === "app"}>
        <RootLayout>{/* Your existing app content */}</RootLayout>
        <DialogManager />
      </Match>
      <Match when={viewManager.activeView() === "settings"}>
        <div class="h-screen w-screen bg-background p-4">
          {/* Settings content */}
          <h1 class="text-2xl font-bold mb-4">Settings</h1>
          {/* Add your settings components here */}
        </div>
      </Match>
    </Switch>
  );
}
