import { Accessor, Component } from 'solid-js'

import { useWorkspace } from '../../../../data/queries/workspaces/use-workspace'

/**
 * Workspace settings page component
 * Contains settings for workspaces configuration
 */
export const WorkspaceSettings: Component<{ id: Accessor<string> }> = (
  props
) => {
  const workspace = useWorkspace({
    workspaceId: props.id,
  })

  return (
    <div>
      <h2 class="text-xl font-semibold mb-2">{workspace.data?.name}</h2>

      <code>
        <pre>{JSON.stringify(workspace.data, null, 2)}</pre>
      </code>

      <div class="space-y-4">
        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Workspace Details</h3>
          <p class="text-sm text-muted">
            Workspace name, description, and general settings
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Members & Access</h3>
          <p class="text-sm text-muted">
            Manage workspace access and permissions
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Integrations</h3>
          <p class="text-sm text-muted">
            Configure workspace-specific integrations
          </p>
        </div>

        <div class="p-4 bg-elements-background-soft rounded-lg">
          <h3 class="text-lg font-medium mb-2">Advanced Settings</h3>
          <p class="text-sm text-muted">
            Configure advanced workspace settings
          </p>
        </div>
      </div>
    </div>
  )
}
