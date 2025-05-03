import { Component, For } from "solid-js";
import {
  useAppSettings,
  StaticSettingsItem,
  DynamicSettingsItemType,
} from "../app-settings.context";
import { useWorkspaces } from "../../../data/queries/workspaces/use-workspaces";
import { useAiIntegrations } from "../../../data/queries/ai-integrations/use-ai-integrations";

export const AppSettingsSidebar: Component = () => {
  const { activeItem, setActiveItem } = useAppSettings();

  const staticItems: { key: StaticSettingsItem; label: string }[] = [
    { key: "general", label: "General" },
    { key: "chats", label: "Chats" },
    { key: "look-and-feel", label: "Look & Feel" },
  ];

  const handleItemClick = (
    type: "static" | DynamicSettingsItemType,
    key: string
  ) => {
    if (type === "static") {
      setActiveItem({ type: "static", item: key as StaticSettingsItem });
    } else {
      setActiveItem({ type: type as DynamicSettingsItemType, id: key });
    }
  };

  const isItemActive = (
    type: "static" | DynamicSettingsItemType,
    key: string
  ): boolean => {
    const currentItem = activeItem();
    if (!currentItem) return false;
    if (currentItem.type === "static" && type === "static") {
      return currentItem.item === key;
    }
    if (currentItem.type !== "static" && type !== "static") {
      return currentItem.type === type && currentItem.id === key;
    }
    return false;
  };

  const worksapces = useWorkspaces();
  const aiIntegrations = useAiIntegrations();

  return (
    <nav class="flex flex-col px-4 border-r-2px border-elements-background-soft w-320px h-full">
      <h3 class="text-ui font-600 mb-16px">Settings</h3>

      {/* Static Items */}
      <ul class="mb-22px">
        <For each={staticItems}>
          {(item) => (
            <li class="mb-1">
              <button
                onClick={() => handleItemClick("static", item.key)}
                class={`w-full text-muted text-left text-ui px-16px h-button rounded-11px hover:bg-elements-background ${
                  isItemActive("static", item.key)
                    ? "bg-elements-background-soft text-selected"
                    : ""
                }`}
              >
                {item.label}
              </button>
            </li>
          )}
        </For>
      </ul>

      {/* Dynamic Workspaces */}
      <h4 class="text-ui font-semibold mb-16px">Workspaces</h4>
      <ul class="mb-22px">
        <For each={worksapces?.data}>
          {(workspace) => (
            <li class="mb-1">
              <button
                onClick={() => handleItemClick("workspace", workspace.id)}
                class={`w-full text-muted text-left text-ui px-16px h-button rounded-11px hover:bg-elements-background ${
                  isItemActive("workspace", workspace.id)
                    ? "bg-elements-background-soft text-selected"
                    : ""
                }`}
              >
                {workspace.name}
              </button>
            </li>
          )}
        </For>
      </ul>

      {/* Dynamic AI Integrations */}
      <h4 class="text-ui font-semibold mb-16px">AI Integrations</h4>
      <ul class="mb-22px">
        <For each={aiIntegrations?.data}>
          {(integration) => (
            <li class="mb-1">
              <button
                onClick={() =>
                  handleItemClick("ai-integration", integration.id)
                }
                class={`w-full text-muted text-left text-ui px-16px h-button rounded-11px hover:bg-elements-background ${
                  isItemActive("ai-integration", integration.id)
                    ? "bg-elements-background-soft text-selected"
                    : ""
                }`}
              >
                {integration.displayName}
              </button>
            </li>
          )}
        </For>
        <li class="mb-1">
          <button
            onClick={() => handleItemClick("static", "add-ai-integration")}
            class={`w-full text-muted text-left text-ui px-16px h-button rounded-11px hover:bg-elements-background ${
              isItemActive("static", "add-ai-integration")
                ? "bg-elements-background-soft text-selected"
                : ""
            }`}
          >
            Add AI Integration
          </button>
        </li>
      </ul>
    </nav>
  );
};
