export function NavigationSidebar() {
  return (
    <div class="relative flex flex-col items-center gap-8px">
      <div class="rounded-default bg-window-elements-background h-button w-button flex items-center justify-center">
        <div class="i-lucide:activity text-16px text-muted" />
      </div>
      <div class="rounded-default hover:bg-window-elements-background h-button w-button flex items-center justify-center">
        <div class="i-lucide:folder-tree text-16px text-muted" />
      </div>
    </div>
  );
}
