import { Component } from "solid-js";
import { AppSettingsProvider } from "./app-settings.context";
import { AppSettingsSidebar } from "./app-settings-sidebar.component";
import { AppSettingsMain } from "./app-settings-main.component";

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
