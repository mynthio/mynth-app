import { Match } from 'solid-js'
import { Switch } from 'solid-js'

import { ChatSidebar } from '../../features/chat/sidebar'
import { SettingsSidebar } from '../../features/settings/sidebar'
import { navigationStore } from '../../stores/navigation.store'

export function SidebarContent() {
  return (
    <div class="w-full h-full flex-1 relative border-l border-background pl-2px">
      <Switch>
        <Match when={navigationStore.content.type === 'chat'}>
          <ChatSidebar />
        </Match>
        <Match when={navigationStore.content.type === 'settings'}>
          <SettingsSidebar />
        </Match>
      </Switch>
    </div>
  )
}
