import { Show } from "solid-js";
import { useWorkspace } from "../../data/queries/workspaces/use-workspace";
import { navigationStore } from "../../stores/navigation.store";
import { appConfig } from "../../stores/app-config.store";
import { openDialog } from "../../features/dialogs";

export function NavigationSidebar() {
  const workspace = useWorkspace({
    workspaceId: () => navigationStore.workspace.id,
  });

  return (
    <div class="relative flex flex-col items-center h-full justify-between gap-4px w-navigation-sidebar mt-4px pb-8px">
      <div class="flex flex-col items-center gap-4px">
        <div class="rounded-default bg-elements-background-soft text-selected size-34px flex items-center justify-center">
          <div class="i-lucide:messages-square text-15px text-selected" />
        </div>
        <div class="rounded-default text-muted size-34px flex items-center justify-center">
          <div class="i-lucide:folder-tree text-15px text-muted" />
        </div>
      </div>

      <div class="flex flex-col items-center gap-4px">
        <button
          class="rounded-default text-muted size-34px flex items-center justify-center cursor-default"
          onClick={() => {
            openDialog({ id: "app-settings", payload: {} });
          }}
        >
          <div class="i-lucide:bolt text-15px text-muted" />
        </button>
      </div>
    </div>
  );
}
