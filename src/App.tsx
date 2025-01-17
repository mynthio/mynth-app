import { useSelector } from "@xstate/store/solid";
import RootLayout from "./layouts/root-layout";
import { tabsManager } from "./lib/tabs-manager/tabs-manager.store";
import { createMemo, Match, Switch } from "solid-js";
import ChatPage from "./pages/chat/chat.page";
import EmptyPage from "./pages/empty.page";
import { DialogManager } from "./components/dialogs/dialog-manager";
import AiIntegrationsSettingsPage from "./pages/settings/ai-integrations-settings.page";
import AppSettingsPage from "./pages/settings/app-settings.page";

export default function App() {
  const activeTabId = useSelector(
    tabsManager,
    (state) => state.context.activeTab
  );
  const tabs = useSelector(tabsManager, (state) => state.context.tabs);
  const tab = createMemo(() => {
    return activeTabId() ? tabs().get(activeTabId()!) : null;
  });

  return (
    <>
      <RootLayout>
        <Switch fallback={"..."}>
          <Match when={tab()?.type === "chat"}>
            <ChatPage chatId={tab()!.chatId!} />
          </Match>
          <Match when={tab()?.type === "empty"}>
            <EmptyPage />
          </Match>
          <Match when={tab()?.type === "settings-ai_integrations"}>
            <AiIntegrationsSettingsPage />
          </Match>
          <Match when={tab()?.type === "settings-app_settings"}>
            <AppSettingsPage />
          </Match>
        </Switch>
      </RootLayout>
      <DialogManager />
    </>
  );
}
