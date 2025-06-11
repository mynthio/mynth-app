import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getAllNodeMessagesByNodeId } from '@/data/api/node-messages/get-all-node-messgaes-by-node-id'
import { NODE_MESSAGES_BY_NODE_ID_KEYS } from '@/data/utils/query-keys'

interface UseNodeMessagesProps {
  nodeId: Accessor<string>
}

export const useNodeMessages = ({ nodeId }: UseNodeMessagesProps) => {
  return useQuery(() => ({
    queryKey: NODE_MESSAGES_BY_NODE_ID_KEYS({ nodeId }),
    queryFn: () => getAllNodeMessagesByNodeId(nodeId()),
  }))
}
