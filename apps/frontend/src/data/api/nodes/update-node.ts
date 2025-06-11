import { invoke } from '@tauri-apps/api/core'

import { UpdateNode } from '@/shared/types/nodes/update-node.type'

export const updateNode = async (payload: UpdateNode) => {
  return invoke<void>('update_node', {
    payload,
  })
}
