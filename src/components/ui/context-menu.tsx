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
        class="bg-[#b6b6b6]/10 text-[#eaf3ec] z-[999999] border-[#b6b6b6]/30 backdrop-blur-xl rounded-[7px] px-[4px] py-[4px] text-[13px] border border-solid space-y-[5px] min-w-[120px] shadow-lg shadow-black/25"
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
      class="hover:bg-[#eaf3ec]/10 px-[12px] py-[2px] rounded-[5px]"
    />
  );
}
