import { Component } from 'solid-js'

/**
 * Look & Feel settings page component
 * Contains settings for application appearance and UI
 */
export const LookAndFeelSettings: Component = () => {
  return (
    <div>
      <h2 class="text-xl font-semibold mb-4">Look & Feel Settings</h2>
      <p class="text-muted mb-6">
        Customize the appearance of the application.
      </p>

      <div class="space-y-4">
        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Theme</h3>
          <p class="text-sm text-muted">
            Choose between light, dark, or system theme
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Layout</h3>
          <p class="text-sm text-muted">Customize the application layout</p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Fonts</h3>
          <p class="text-sm text-muted">
            Configure font size and family preferences
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Colors</h3>
          <p class="text-sm text-muted">
            Customize accent colors and color schemes
          </p>
        </div>
      </div>
    </div>
  )
}
