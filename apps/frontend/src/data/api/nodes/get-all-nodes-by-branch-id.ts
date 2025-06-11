import { invoke } from '@tauri-apps/api/core'

import { Node } from '@/shared/types/nodes/node.type'

export const getAllNodesByBranchId = async (branchId: string) => {
  return invoke<Node[]>('get_all_nodes_by_branch_id', {
    branchId,
  })
}
