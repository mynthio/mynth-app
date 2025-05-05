import { invoke } from '@tauri-apps/api/core'

import { Workspace } from '@shared/types/workspace/workspace.type'

export function getAllWorkspaces() {
  console.debug('[api|getAllWorkspaces]')
  return invoke<Workspace[]>('get_all_workspaces')
}
