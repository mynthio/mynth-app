import { createMemo } from 'solid-js'

import { type EmptyTab, pop, state, switchTo } from '../../tabs.store'
import { TabBase } from './tab-base'

export function EmptyTab({ tab }: { tab: EmptyTab }) {
  const isActive = createMemo(() => tab.id === state.currentTab)
  return (
    <TabBase
      tab={tab}
      tooltip={tab.title}
      isActive={isActive()}
      onClick={() => switchTo(tab.id)}
      onClose={() => pop(tab.id)}
    />
  )
}
