import { Accessor } from 'solid-js'

import { createQuery, useQuery } from '@tanstack/solid-query'

import { getChat } from '../../api/chats/get-chat'
import { GET_CHAT_KEYS } from '../../utils/query-keys'

interface UseChatProps {
  chatId: Accessor<string>
}

export const useChat = ({ chatId }: UseChatProps) => {
  return useQuery(() => ({
    queryKey: GET_CHAT_KEYS({ chatId }),
    queryFn: () => getChat(chatId()),
  }))
}
