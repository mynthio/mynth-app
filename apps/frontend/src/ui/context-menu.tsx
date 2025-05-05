import { Menu, useMenu } from '@ark-ui/solid/menu'
import { JSX } from 'solid-js/jsx-runtime'

export const useMenuContext = useMenu

interface ContextMenuProviderProps extends Menu.RootProviderProps {}

export function ContextMenuProvider(props: ContextMenuProviderProps) {
  return <Menu.RootProvider {...props} />
}

interface ContextMenuProps extends Menu.RootProps {}

export function ContextMenu(props: ContextMenuProps) {
  return <Menu.Root {...props} />
}

interface ContextMenuTriggerProps extends Menu.ContextTriggerProps {}

export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <Menu.ContextTrigger {...props} />
}

interface ContextMenuContentProps {
  children: JSX.Element
}

export function ContextMenuContent(props: ContextMenuContentProps) {
  return (
    <Menu.Positioner>
      <Menu.Content class="z-99999 outline-none bg-[#9ea5b2] bg-opacity-06 border border-accent/25 shadow-xl backdrop-blur-50px rounded-12px p-3px min-w-220px">
        {props.children}
      </Menu.Content>
    </Menu.Positioner>
  )
}

interface ContextMenuItemProps extends Menu.ItemProps {}

export function ContextMenuItem(props: ContextMenuItemProps) {
  return (
    <Menu.Item
      {...props}
      class="px-12px py-4px text-body font-500 text-13px data-[highlighted]:bg-accent/5 rounded-9px"
    />
  )
}

interface ContextMenuSeparatorProps extends Menu.SeparatorProps {}

export function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  return (
    <Menu.Separator
      {...props}
      class="h-1px border-accent/25 w-[calc(100%-20px)] ml-10px my-3px"
    />
  )
}

interface ContextMenuGroupProps extends Menu.ItemGroupProps {}

export function ContextMenuGroup(props: ContextMenuGroupProps) {
  return <Menu.ItemGroup {...props} />
}

interface ContextMenuGroupLabelProps extends Menu.ItemGroupLabelProps {}

export function ContextMenuGroupLabel(props: ContextMenuGroupLabelProps) {
  return <Menu.ItemGroupLabel {...props} />
}
