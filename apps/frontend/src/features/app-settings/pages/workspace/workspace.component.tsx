import { Accessor, Component, createResource } from 'solid-js'

import { invoke } from '@tauri-apps/api/core'

import { integrateProvider } from '@/data/api/providers/integrate-provider'

import { selectWorkspaceConfig } from '../../../../data/api/workspaces/select-workspace-config'
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

  const [workspaceConfig] = createResource(async () => {
    const config = await selectWorkspaceConfig(props.id())
    return config
  })

  const [providers] = createResource(async () => {
    const providers = await invoke('marketplace_api_list_providers')
    return providers as any
  })

  return (
    <div>
      <h2 class="text-xl font-semibold mb-2">{workspace.data?.name}</h2>

      <button
        onClick={() => {
          invoke('call_chat')
        }}
      >
        Test the chat endpoint
      </button>

      <h3>Workspace</h3>
      <code>
        <pre>{JSON.stringify(workspace.data, null, 2)}</pre>
      </code>

      <h3>Workspace Config</h3>
      <code>
        <pre>{JSON.stringify(workspaceConfig(), null, 2)}</pre>
      </code>

      <h3>Providers</h3>
      <code>
        <pre>{JSON.stringify(providers(), null, 2)}</pre>
      </code>

      <button
        onClick={() => integrateProvider(providers() ? providers()[0].id : '')}
      >
        Integrate Provider
      </button>
    </div>
  )
}
