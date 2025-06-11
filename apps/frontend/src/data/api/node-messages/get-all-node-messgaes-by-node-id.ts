import { invoke } from '@tauri-apps/api/core'

import { NodeMessage } from '@/shared/types/node-message/node-message.type'

export const getAllNodeMessagesByNodeId = async (nodeId: string) => {
  return invoke<NodeMessage[]>('get_all_node_messages_by_node_id_formatted', {
    nodeId,
  })
}
