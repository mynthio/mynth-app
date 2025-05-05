import { createShortcut } from '@solid-primitives/keyboard'

import { next, push, pushEmpty } from './tabs.store'

export function TabsKbdShortcuts() {
  createShortcut(
    ['Meta', 'T'],
    () => {
      pushEmpty()
    },
    { preventDefault: true, requireReset: false }
  )

  createShortcut(
    ['Control', 'Tab'],
    () => {
      next()
    },
    { preventDefault: true, requireReset: false }
  )

  return null
}
