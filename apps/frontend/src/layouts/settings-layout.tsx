import { invoke } from "@tauri-apps/api/core";
import { createResource, createSignal, For, JSX, Accessor } from "solid-js";
import {
  SettingsProvider,
  SettingsRouterContext,
  useSettingsRouter,
} from "../providers/settings-provider";
export default function SettingsLayout({
  children,
}: {
  children: (props: {
    view: Accessor<string>;
    props: Accessor<Record<string, unknown>>;
  }) => JSX.Element;
}) {
  const [view, setView] = createSignal("general");
  const [props, setProps] = createSignal({});

  return (
    <SettingsProvider>
      <div class="flex">
        <SettingsMenu view={view} setView={setView} setProps={setProps} />
        <div>{children({ view, props })}</div>
      </div>
    </SettingsProvider>
  );
}

function SettingsMenu({
  view,
  setView,
  setProps,
}: {
  view: string;
  setView: (view: string) => void;
  setProps: (props: Record<string, unknown>) => void;
}) {
  const [aiIntegrations] = createResource(async () => {
    const response = await invoke("get_ai_integrations");
    return response;
  });

  return (
    <Menu>
      <MenuSection>
        <MenuItem onClick={() => setView("general")}>General</MenuItem>
        <MenuItem onClick={() => setView("themes_and_appearance")}>
          Themes & Appearance
        </MenuItem>
        <MenuItem onClick={() => setView("commands")}>Commands</MenuItem>
        <MenuItem onClick={() => setView("keyboard_shortcuts")}>
          Keyboard Shortcuts
        </MenuItem>
        <MenuItem onClick={() => setView("advanced")}>Advanced</MenuItem>
      </MenuSection>
      <MenuSection>
        <MenuSectionTitle>AI Integrations</MenuSectionTitle>
        <For each={aiIntegrations()}>
          {(integration) => (
            <MenuItem
              onClick={() => {
                setView("ai_integration");
                setProps({ id: integration.id });
              }}
            >
              {integration.name}
            </MenuItem>
          )}
        </For>
      </MenuSection>
    </Menu>
  );
}

function Menu(props: { children: JSX.Element }) {
  return <div class="w-64 px-2 flex flex-col gap-2">{props.children}</div>;
}

function MenuSection(props: { children: JSX.Element }) {
  return <div>{props.children}</div>;
}

function MenuSectionTitle(props: { children: JSX.Element }) {
  return (
    <div class="text-neutral text-[11px] font-light uppercase">
      {props.children}
    </div>
  );
}

function MenuItem(props: {
  children: JSX.Element;
  insertBefore?: JSX.Element;
  onClick?: () => void;
}) {
  return (
    <div
      class="px-2 py-1 rounded-md hover:bg-gray-100/5 text-neutral text-[14px] font-light flex items-center gap-2"
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}
