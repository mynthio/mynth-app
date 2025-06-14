import { useWorkspace } from '../../data/queries/workspaces/use-workspace'
import { openDialog } from '../../features/dialogs'
import { navigationStore } from '../../stores/navigation.store'

export function NavigationSidebar() {
  const workspace = useWorkspace({
    workspaceId: () => navigationStore.workspace.id,
  })

  return (
    <div
      data-tauri-drag-region
      class="relative flex flex-col items-center h-full justify-between gap-4px w-32px mt-4px pb-8px"
    >
      <div class="flex flex-col items-center gap-4px">
        <div class="rounded-8px bg-elements-background-soft text-selected size-28px flex items-center justify-center">
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
            openDialog({ id: 'app-settings', payload: {} })
          }}
        >
          <div class="i-lucide:bolt text-15px text-muted" />
        </button>
      </div>
    </div>
  )
}
