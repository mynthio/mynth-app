import { Accessor, createResource, Match, Switch, useContext } from "solid-js";
import { viewManager } from "../stores/view-manager.store";
import RootLayout from "../layouts/root-layout";
import { DialogManager } from "./dialogs/dialog-manager";
import SettingsLayout from "../layouts/settings-layout";
import {
  SettingsRouterContext,
  useSettingsRouter,
} from "../providers/settings-provider";
import { invoke } from "@tauri-apps/api/core";

export function ViewContainer() {
  return (
    <Switch>
      <Match when={viewManager.activeView() === "app"}>
        <RootLayout>{/* Your existing app content */}</RootLayout>
        {/* <DialogManager /> */}
      </Match>
      <Match when={viewManager.activeView() === "settings"}>
        <SettingsLayout>
          {({ view, props }) => <SettingsView view={view} props={props} />}
        </SettingsLayout>
      </Match>
    </Switch>
  );
}

function SettingsView({
  view,
  props,
}: {
  view: Accessor<string>;
  props: Accessor<Record<string, unknown>>;
}) {
  return (
    <Switch>
      <Match when={view() === "general"}>General</Match>
      <Match when={view() === "ai_integration"}>
        <AiIntegrationView id={props().id} />
      </Match>
    </Switch>
  );
}

function AiIntegrationView(props: { id: string }) {
  const [integration, setIntegration] = createResource(async () => {
    return invoke("get_ai_integration", { id: props.id });
  });
  return (
    <div>
      <h1>AI Integration</h1>
      <div>{props.id}</div>
      <div>{JSON.stringify(integration())}</div>
    </div>
  );
}
