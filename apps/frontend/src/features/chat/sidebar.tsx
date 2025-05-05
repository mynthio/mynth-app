import { Match } from 'solid-js'
import { Switch } from 'solid-js'
import { createSignal } from 'solid-js'

import { ActivitySidebar } from './components/sidebar/activity-sidebar'
import { TreeSidebar } from './components/sidebar/tree-sidebar'

export function ChatSidebar() {
  const [currentView, setCurrentView] = createSignal<'activity' | 'tree'>(
    'activity'
  )

  return (
    <div class="">
      <div>
        <Switch>
          <Match when={currentView() === 'activity'}>
            <ActivitySidebar />
          </Match>
          <Match when={currentView() === 'tree'}>
            <TreeSidebar />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
