import { createShortcut } from '@solid-primitives/keyboard'

import { Show } from 'solid-js'

import {
  navigationStore,
  setNavigationStore,
} from '../../stores/navigation.store'
import { NavigationSidebar } from './navigation-sidebar'
import { SidebarContent } from './sidebar-content'

export function Sidebar() {
  createShortcut(
    ['Meta', 'B'],
    () => {
      setNavigationStore('sidebar', 'isOpen', (isOpen) => !isOpen)
    },
    { preventDefault: true, requireReset: false }
  )

  return (
    <div
      classList={{
        'w-sidebar': navigationStore.sidebar.isOpen,
        'w-0': !navigationStore.sidebar.isOpen,
      }}
      class="transition-all duration-200 flex flex-shrink-0 gap-2px"
    >
      {/* <NavigationSidebar /> */}

      <Show when={navigationStore.sidebar.isOpen}>
        <SidebarContent />
      </Show>
    </div>
  )
}
