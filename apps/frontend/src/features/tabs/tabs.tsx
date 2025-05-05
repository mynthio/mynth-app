import { For, Match, Switch } from 'solid-js'

import { ChatTab } from './components/tabs/chat-tab'
import { EmptyTab } from './components/tabs/empty-tab'
import {
  type ChatTab as ChatTabType,
  type EmptyTab as EmptyTabType,
  state,
} from './tabs.store'

export function Tabs() {
  return (
    <div
      class="flex items-center gap-5px h-full w-full min-w-0"
      data-tauri-drag-region
    >
      <For each={state.tabs} fallback={<EmptyTab tab={state.tabs[0]} />}>
        {(tab) => (
          <Switch fallback={<EmptyTab tab={state.tabs[0]} />}>
            <Match when={tab.type === 'chat'}>
              <ChatTab tab={tab as ChatTabType} />
            </Match>
            <Match when={tab.type === 'empty'}>
              <EmptyTab tab={tab as EmptyTabType} />
            </Match>
          </Switch>
        )}
      </For>
    </div>
  )
}
