import { invoke } from '@tauri-apps/api/core'

import { Branch } from '@/shared/types/branch/branch.type'

export const cloneBranch = async (branchId: string, afterNodeId?: string) => {
  return invoke<Branch>('clone_branch', { branchId, afterNodeId })
}
