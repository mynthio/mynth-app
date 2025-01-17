import { Menu } from "@ark-ui/solid/menu";
import { ComponentProps, JSX } from "solid-js";

// Root
export const ContextMenu = Menu.Root;

// Trigger
type ContextMenuTriggerProps = ComponentProps<typeof Menu.ContextTrigger>;

export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <Menu.ContextTrigger {...props} />;
}

// Content
type ContextMenuContentProps = {
  children: JSX.Element;
};

export function ContextMenuContent(props: ContextMenuContentProps) {
  return (
    <Menu.Positioner>
      <Menu.Content
        {...props}
        class="bg-white/10 text-white/80 backdrop-blur-lg rounded-[8px] px-[4px] py-[4px] text-[14px] border border-solid border-white/10 space-y-[5px] min-w-[120px]"
      />
    </Menu.Positioner>
  );
}

// Item
type ContextMenuItemProps = ComponentProps<typeof Menu.Item>;

export function ContextMenuItem(props: ContextMenuItemProps) {
  return (
    <Menu.Item
      {...props}
      class="hover:bg-white/10 px-[8px] py-[2px] rounded-[4px]"
    />
  );
}
