import { Component } from 'solid-js'

/**
 * General settings page component
 * Contains settings for general application configuration
 */
export const GeneralSettings: Component = () => {
  return (
    <div>
      <h2 class="text-xl font-semibold mb-4">General Settings</h2>
      <p class="text-muted mb-6">
        Configure general application settings here.
      </p>

      <div class="space-y-4">
        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Application Preferences</h3>
          <p class="text-sm text-muted">
            Basic configuration options for the app
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">User Profile</h3>
          <p class="text-sm text-muted">Manage your user profile settings</p>
        </div>
      </div>
    </div>
  )
}
