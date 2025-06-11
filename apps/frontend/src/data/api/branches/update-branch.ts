import { invoke } from '@tauri-apps/api/core'

import { Branch, UpdateBranch } from '@/shared/types/branch/branch.type'

export const updateBranch = async (branch: UpdateBranch) => {
  return invoke<Branch>('update_branch', { branch })
}
