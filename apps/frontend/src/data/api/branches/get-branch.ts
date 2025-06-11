import { invoke } from '@tauri-apps/api/core'

import { Branch } from '@/shared/types/branch/branch.type'

export const getBranch = async (branchId: string) => {
  return invoke<Branch>('get_branch', {
    branchId,
  })
}
