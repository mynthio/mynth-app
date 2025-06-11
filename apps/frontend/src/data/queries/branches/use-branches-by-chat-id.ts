import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getBranchesByChatId } from '@/data/api/branches/get-branches-by-chat-id'
import { BRANCHES_BY_CHAT_ID_KEYS } from '@/data/utils/query-keys'

export const useBranchesByChatId = ({
  chatId,
}: {
  chatId: Accessor<string>
}) => {
  return useQuery(() => ({
    queryKey: BRANCHES_BY_CHAT_ID_KEYS({ chatId }),
    queryFn: () => getBranchesByChatId(chatId()),
  }))
}
