import { Match, Switch, createMemo } from 'solid-js'

import { ChatView } from '../../features/chat/view'
import { View as SettingsView } from '../../features/settings/view'
import { state } from '../../features/tabs/tabs.store'
import { navigationStore } from '../../stores/navigation.store'

export function Content() {
  const tab = createMemo(() => {
    return state.tabs.find((t) => t.id === state.currentTab)
  })

  return (
    <div class="relative size-full bg-background rounded-default">
      <Switch>
        <Match when={tab()?.type === 'chat'}>
          <ChatView />
        </Match>
        <Match when={navigationStore.content.type === 'settings'}>
          <SettingsView />
        </Match>
      </Switch>
    </div>
  )
}
