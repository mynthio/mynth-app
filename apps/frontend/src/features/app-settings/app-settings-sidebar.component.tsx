import { Component, For } from "solid-js";
import {
  useAppSettings,
  StaticSettingsItem,
  DynamicSettingsItemType,
} from "./app-settings.context";

// Mock data for dynamic items - replace with actual data fetching later
const mockWorkspaces = [
  { id: "ws1", name: "Workspace Alpha" },
  { id: "ws2", name: "Workspace Beta" },
];

const mockAiIntegrations = [
  { id: "ai1", name: "Integration X" },
  { id: "ai2", name: "Integration Y" },
];

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

  return (
    <nav class="flex flex-col p-4 border-r border-gray-200 w-64 h-full bg-gray-50">
      <h3 class="text-lg font-semibold mb-4">Settings</h3>

      {/* Static Items */}
      <ul class="mb-6">
        <For each={staticItems}>
          {(item) => (
            <li class="mb-1">
              <button
                onClick={() => handleItemClick("static", item.key)}
                class={`w-full text-left px-3 py-1 rounded hover:bg-gray-200 ${
                  isItemActive("static", item.key)
                    ? "bg-blue-100 text-blue-700 font-medium"
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
      <h4 class="text-md font-semibold mb-2">Workspaces</h4>
      <ul class="mb-6">
        <For each={mockWorkspaces}>
          {(workspace) => (
            <li class="mb-1">
              <button
                onClick={() => handleItemClick("workspace", workspace.id)}
                class={`w-full text-left px-3 py-1 rounded hover:bg-gray-200 ${
                  isItemActive("workspace", workspace.id)
                    ? "bg-blue-100 text-blue-700 font-medium"
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
      <h4 class="text-md font-semibold mb-2">AI Integrations</h4>
      <ul>
        <For each={mockAiIntegrations}>
          {(integration) => (
            <li class="mb-1">
              <button
                onClick={() =>
                  handleItemClick("ai-integration", integration.id)
                }
                class={`w-full text-left px-3 py-1 rounded hover:bg-gray-200 ${
                  isItemActive("ai-integration", integration.id)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : ""
                }`}
              >
                {integration.name}
              </button>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
};
