import {
  type ChatTab as ChatTabType,
  pop,
  state,
  switchTo,
} from '../../tabs.store'
import { TabBase } from './tab-base'

export function ChatTab({ tab }: { tab: ChatTabType }) {
  return (
    <TabBase
      tab={tab}
      icon={null}
      tooltip={tab.title}
      onClick={() => switchTo(tab.id)}
      onAuxClick={() => pop(tab.id)}
      onClose={() => pop(tab.id)}
    />
  )
}
