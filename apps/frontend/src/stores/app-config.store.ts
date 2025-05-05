import { createStore } from 'solid-js/store'

import { load } from '@tauri-apps/plugin-store'

interface AppConfig {
  window: {
    showTrafficLights: boolean
  }
}

const [appConfig, setAppConfig] = createStore<AppConfig>({
  window: {
    showTrafficLights: true,
  },
})

load('store.json', { autoSave: false }).then((store) => {
  store.get('window').then((value) => {
    console.log(value)
    if (value) {
      setAppConfig('window', value as any)
    }
  })
})

export { appConfig, setAppConfig }
