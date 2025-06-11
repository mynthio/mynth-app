import { Component } from 'solid-js'

import { AppSettingsProvider } from './app-settings.context'
import { AppSettingsMain } from './components/app-settings-main.component'
import { AppSettingsSidebar } from './components/app-settings-sidebar.component'

/**
 * Main App Settings component
 * Assembles the app settings UI with sidebar and main content area
 */
export const AppSettingsComponent: Component = () => {
  return (
    <AppSettingsProvider>
      <div class="flex h-full w-full pt-45px">
        <AppSettingsSidebar />
        <AppSettingsMain />
      </div>
    </AppSettingsProvider>
  )
}
