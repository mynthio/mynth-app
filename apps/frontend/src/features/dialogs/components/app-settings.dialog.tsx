import { AppSettingsComponent } from '../../app-settings/app-settings.component'

export const APP_SETTINGS_DIALOG_EVENT_ID = 'app-settings'

export type AppSettingsDialogProps = {
  // Add any props needed for the settings dialog here
}

export function AppSettingsDialog(props: AppSettingsDialogProps) {
  return <AppSettingsComponent />
}
