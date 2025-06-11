import { Menu as ArkMenu } from '@ark-ui/solid/menu'

import { ComponentProps } from 'solid-js'

interface Menu extends ComponentProps<typeof ArkMenu.Root> {}

export function Menu(props: Menu) {
  return (
    <ArkMenu.Root
      positioning={{
        gutter: 4,
      }}
      {...props}
    />
  )
}

interface MenuTrigger extends ComponentProps<typeof ArkMenu.Trigger> {}

export function MenuTrigger(props: MenuTrigger) {
  return <ArkMenu.Trigger {...props} />
}

interface MenuContent extends ComponentProps<typeof ArkMenu.Content> {}

export function MenuContent(props: MenuContent) {
  return (
    <ArkMenu.Positioner>
      <ArkMenu.Content
        {...props}
        class="min-w-220px bg-background/10 z-100 backdrop-blur-32px rounded-12px p-5px border border-[#889894]/15 shadow-xl"
      />
    </ArkMenu.Positioner>
  )
}

interface MenuItem extends ComponentProps<typeof ArkMenu.Item> {}

export function MenuItem(props: MenuItem) {
  return (
    <ArkMenu.Item
      {...props}
      onContextMenu={(e: Event) => e.preventDefault()}
      class="data-[highlighted]:bg-accent/10 hover:bg-accent/10 active:scale-98 active:bg-accent/15 data-[highlighted]:text-body transition-colors transition-transform transition-duration-150ms px-24px py-4px text-body/90 rounded-7px text-14px cursor-default flex items-center gap-8px"
    />
  )
}

interface MenuSeparator extends ComponentProps<typeof ArkMenu.Separator> {}

export function MenuSeparator(props: MenuSeparator) {
  return <ArkMenu.Separator {...props} class="border-[#889894]/15 my-6px" />
}

interface MenuItemGroup extends ComponentProps<typeof ArkMenu.ItemGroup> {}

export function MenuItemGroup(props: MenuItemGroup) {
  return <ArkMenu.ItemGroup {...props} />
}

interface MenuItemGroupLabel
  extends ComponentProps<typeof ArkMenu.ItemGroupLabel> {}

export function MenuItemGroupLabel(props: MenuItemGroupLabel) {
  return (
    <ArkMenu.ItemGroupLabel
      {...props}
      class="px-24px py-6px text-10px font-medium text-body/60 uppercase tracking-wide"
    />
  )
}
