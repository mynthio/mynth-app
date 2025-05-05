import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getAllChats } from '../../api/chats/get-all-chats'
import { GET_CHATS_KEYS } from '../../utils/query-keys'

interface UseChatsProps {
  workspaceId: Accessor<string>
}

export const useChats = ({ workspaceId }: UseChatsProps) => {
  return useQuery(() => ({
    queryKey: GET_CHATS_KEYS({ workspaceId }),
    queryFn: () => getAllChats(workspaceId()),
  }))
}
