import { invoke } from '@tauri-apps/api/core'

import { WorkspaceSelectConfig } from '@shared/types/workspace/workspace-select-config.type'

export const selectWorkspaceConfig = async (workspaceId: string) => {
  console.debug('[api|selectWorkspaceConfig]', `Workspace ID: ${workspaceId}`)
  return invoke<WorkspaceSelectConfig | null>('select_workspace_config', {
    workspaceId,
  })
}
