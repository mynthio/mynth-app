import { DropdownMenu as KobalteDropdownMenu } from "@kobalte/core/dropdown-menu";
import { ComponentProps } from "solid-js";

interface DropdownMenu extends ComponentProps<typeof KobalteDropdownMenu> {}

export function DropdownMenu(props: DropdownMenu) {
  return <KobalteDropdownMenu {...props} />;
}

interface DropdownMenuContent
  extends ComponentProps<typeof KobalteDropdownMenu.Content> {}

export function DropdownMenuContent(props: DropdownMenuContent) {
  return (
    <KobalteDropdownMenu.Portal>
      <KobalteDropdownMenu.Content
        {...props}
        class="min-w-220px bg-[#889894]/10 backdrop-blur-32px rounded-12px p-5px border border-[#889894]/15"
      />
      ;
    </KobalteDropdownMenu.Portal>
  );
}

interface DropdownMenuItem
  extends ComponentProps<typeof KobalteDropdownMenu.Item> {}

export function DropdownMenuItem(props: DropdownMenuItem) {
  return (
    <KobalteDropdownMenu.Item
      {...props}
      onContextMenu={(e) => e.preventDefault()}
      class="data-[highlighted]:bg-accent/10 hover:bg-accent/10 data-[highlighted]:text-body transition-colors transition-duration-150ms px-24px py-4px text-body/90 rounded-7px text-14px"
    />
  );
}

interface DropdownMenuSeparator
  extends ComponentProps<typeof KobalteDropdownMenu.Separator> {}

export function DropdownMenuSeparator(props: DropdownMenuSeparator) {
  return (
    <KobalteDropdownMenu.Separator
      {...props}
      class="border-[#889894]/15 my-6px"
    />
  );
}

interface DropdownMenuTrigger
  extends ComponentProps<typeof KobalteDropdownMenu.Trigger> {}

export function DropdownMenuTrigger(props: DropdownMenuTrigger) {
  return <KobalteDropdownMenu.Trigger {...props} />;
}
