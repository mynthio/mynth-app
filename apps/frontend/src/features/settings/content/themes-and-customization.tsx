import { Show } from 'solid-js'

import { load } from '@tauri-apps/plugin-store'

import { appConfig, setAppConfig } from '../../../stores/app-config.store'
import {
  Field,
  FieldDescription,
  FieldInput,
  FieldMeta,
  FieldTitle,
} from '../../../ui/field'
import { Switch } from '../../../ui/switch'

const toggleTrafficLights = (newValue: boolean) => {
  setAppConfig('window', 'showTrafficLights', newValue)
  load('store.json', { autoSave: false }).then((store) => {
    store.set('window', { ...appConfig.window, showTrafficLights: newValue })
  })
}

export function ThemesAndCustomization() {
  return (
    <div>
      <div class="max-w-700px px-24px">
        <Field layout="horizontal">
          <FieldMeta>
            <FieldTitle>Show traffic lights</FieldTitle>
            <FieldDescription>
              Want a cleaner look? Toggle those red, yellow, and green macOS
              window controls (aka traffic lights 🚦) on or off. Perfect for
              keyboard warriors who prefer shortcuts, or anyone seeking that
              minimalist vibe!
            </FieldDescription>
          </FieldMeta>
          <FieldInput>
            <Switch
              checked={appConfig.window.showTrafficLights}
              onChange={(checked) => {
                toggleTrafficLights(checked)
              }}
            />
          </FieldInput>
        </Field>
      </div>
    </div>
  )
}
