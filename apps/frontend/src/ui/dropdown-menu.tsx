import { DropdownMenu as KobalteDropdownMenu } from '@kobalte/core/dropdown-menu'

import { ComponentProps } from 'solid-js'

interface DropdownMenu extends ComponentProps<typeof KobalteDropdownMenu> {}

export function DropdownMenu(props: DropdownMenu) {
  return (
    <KobalteDropdownMenu
      {...props}
      gutter={props.gutter ?? 5}
      preventScroll={false}
    />
  )
}

interface DropdownMenuContent
  extends ComponentProps<typeof KobalteDropdownMenu.Content> {}

export function DropdownMenuContent(props: DropdownMenuContent) {
  return (
    <KobalteDropdownMenu.Portal>
      <KobalteDropdownMenu.Content
        {...props}
        class="min-w-220px bg-background/10 z-100 backdrop-blur-32px rounded-12px p-5px border border-[#889894]/15 shadow-xl"
      />
      ;
    </KobalteDropdownMenu.Portal>
  )
}

interface DropdownMenuItem
  extends ComponentProps<typeof KobalteDropdownMenu.Item> {}

export function DropdownMenuItem(props: DropdownMenuItem) {
  return (
    <KobalteDropdownMenu.Item
      {...props}
      onContextMenu={(e: Event) => e.preventDefault()}
      class="data-[highlighted]:bg-accent/10 hover:bg-accent/10 active:scale-98 active:bg-accent/15 data-[highlighted]:text-body transition-colors transition-transform transition-duration-150ms px-24px py-4px text-body/90 rounded-7px text-14px"
    />
  )
}

interface DropdownMenuSeparator
  extends ComponentProps<typeof KobalteDropdownMenu.Separator> {}

export function DropdownMenuSeparator(props: DropdownMenuSeparator) {
  return (
    <KobalteDropdownMenu.Separator
      {...props}
      class="border-[#889894]/15 my-6px"
    />
  )
}

interface DropdownMenuTrigger
  extends ComponentProps<typeof KobalteDropdownMenu.Trigger> {}

export function DropdownMenuTrigger(props: DropdownMenuTrigger) {
  return <KobalteDropdownMenu.Trigger {...props} />
}
