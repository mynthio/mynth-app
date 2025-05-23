import { invoke } from '@tauri-apps/api/core'

import { Workspace } from '@shared/types/workspace/workspace.type'

export const getWorkspace = async (workspaceId: string) => {
  console.debug('[api|getWorkspace]', `Workspace ID: ${workspaceId}`)
  return invoke<Workspace | null>('get_workspace', {
    workspaceId,
  })
}
