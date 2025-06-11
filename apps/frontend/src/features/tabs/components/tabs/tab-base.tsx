import { JSX, createMemo } from 'solid-js'

import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/tooltip'
import { pop, state, switchTo } from '../../tabs.store'

// Props for the base tab component
export type TabBaseProps = {
  tab: { id: string; title: string }
  isActive?: boolean
  icon?: JSX.Element // Custom icon for the tab
  tooltip?: string // Optional tooltip text
  onClick?: () => void // Optional custom click handler
  onAuxClick?: () => void // Optional custom aux click handler
  onClose?: () => void // Optional custom close handler
  children?: JSX.Element // Custom content inside the tab button
}

/**
 * TabBase - A reusable tab component for all tab types.
 * Pass in your own icon, content, and handlers for max flexibility.
 *
 * Why? Because DRY code is happy code. And so are contributors.
 */
export function TabBase({
  tab,
  isActive,
  icon,
  tooltip,
  onClick,
  onAuxClick,
  onClose,
  children,
}: TabBaseProps) {
  const active = createMemo(() => isActive ?? tab.id === state.currentTab)

  const handleClick = () => (onClick ? onClick() : switchTo(tab.id))
  const handleAuxClick = () => (onAuxClick ? onAuxClick() : pop(tab.id))
  const handleClose = () => (onClose ? onClose() : pop(tab.id))

  return (
    <Tooltip floatingOptions={{ offset: 2 }}>
      <TooltipContent>{tooltip ?? tab.title}</TooltipContent>
      <TooltipTrigger
        as="div"
        class="h-28px flex items-center justify-between min-w-0 rounded-default bg-window-elements-background hover:bg-elements-background-soft w-full max-w-260px"
        classList={{
          'bg-elements-background-soft': active(),
        }}
      >
        <button
          onClick={handleClick}
          onAuxClick={handleAuxClick}
          class="w-full h-full flex items-center gap-5px text-10px font-200 px-10px cursor-default hover:bg-elements-background-soft rounded-default min-w-0"
        >
          {icon}
          <div class="truncate min-w-0 text-11px">{children ?? tab.title}</div>
        </button>
        <button
          class="w-30px h-30px rounded-default flex-shrink-0 flex items-center justify-center cursor-default hover:bg-white/5"
          onClick={handleClose}
        >
          <div class="i-lucide:x text-9px text-muted" />
        </button>
      </TooltipTrigger>
    </Tooltip>
  )
}
