import { Component, Match, Switch } from "solid-js";
import { useAppSettings } from "./app-settings.context";

// Placeholder components for different settings sections
const GeneralSettings: Component = () => (
  <div>
    <h2>General Settings</h2>
    <p>Configure general application settings here.</p>
  </div>
);
const ChatSettings: Component = () => (
  <div>
    <h2>Chat Settings</h2>
    <p>Configure chat-related settings here.</p>
  </div>
);
const LookAndFeelSettings: Component = () => (
  <div>
    <h2>Look & Feel Settings</h2>
    <p>Customize the appearance of the application.</p>
  </div>
);

const WorkspaceSettings: Component<{ id: string }> = (props) => (
  <div>
    <h2>Workspace Settings: {props.id}</h2>
    <p>Configure settings specific to workspace {props.id}.</p>
  </div>
);

const AiIntegrationSettings: Component<{ id: string }> = (props) => (
  <div>
    <h2>AI Integration Settings: {props.id}</h2>
    <p>Configure settings specific to AI integration {props.id}.</p>
  </div>
);

export const AppSettingsMain: Component = () => {
  const { activeItem } = useAppSettings();

  return (
    <main class="flex-1 p-6 overflow-auto">
      <Switch fallback={<div>Select an item from the sidebar</div>}>
        <Match
          when={
            activeItem()?.type === "static" && activeItem()?.item === "general"
          }
        >
          <GeneralSettings />
        </Match>
        <Match
          when={
            activeItem()?.type === "static" && activeItem()?.item === "chats"
          }
        >
          <ChatSettings />
        </Match>
        <Match
          when={
            activeItem()?.type === "static" &&
            activeItem()?.item === "look-and-feel"
          }
        >
          <LookAndFeelSettings />
        </Match>
        <Match when={activeItem()?.type === "workspace" && activeItem()?.id}>
          {(item) => <WorkspaceSettings id={item().id} />}
        </Match>
        <Match
          when={activeItem()?.type === "ai-integration" && activeItem()?.id}
        >
          {(item) => <AiIntegrationSettings id={item().id} />}
        </Match>
      </Switch>
    </main>
  );
};
