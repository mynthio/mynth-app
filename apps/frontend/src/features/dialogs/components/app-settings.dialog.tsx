import { closeDialog } from '@/features/dialogs'

import { AppSettingsComponent } from '../../app-settings/app-settings.component'

export const APP_SETTINGS_DIALOG_EVENT_ID = 'app-settings'

export type AppSettingsDialogProps = {
  // Add any props needed for the settings dialog here
}

export function AppSettingsDialog(props: AppSettingsDialogProps) {
  return (
    <>
      <button
        class="absolute top-24px left-24px text-muted flex items-center gap-8px"
        onClick={() => {
          closeDialog()
        }}
      >
        <div class="i-lucide:arrow-left text-14px" />
        <span class="text-ui">Back to app</span>
      </button>

      <button
        class="absolute top-24px right-24px text-muted flex items-center"
        onClick={() => {
          closeDialog()
        }}
      >
        <div class="i-lucide:x text-14px" />
      </button>

      <AppSettingsComponent />
      <div class="flex items-center justify-center gap-12px absolute bottom-8px w-full">
        <span class="text-ui-small text-muted">
          MYNTH APP ALPHA 0.0.243 (17 APR. 2025) - Rhino
        </span>
      </div>
    </>
  )
}
