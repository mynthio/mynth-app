import { Component } from "solid-js";
import { AppSettingsProvider } from "./app-settings.context";
import { AppSettingsSidebar } from "./components/app-settings-sidebar.component";
import { AppSettingsMain } from "./components/app-settings-main.component";

/**
 * Main App Settings component
 * Assembles the app settings UI with sidebar and main content area
 */
export const AppSettingsComponent: Component = () => {
  return (
    <AppSettingsProvider>
      <div class="flex h-full w-full">
        <AppSettingsSidebar />
        <AppSettingsMain />
      </div>
    </AppSettingsProvider>
  );
};
