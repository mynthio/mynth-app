import { invoke } from '@tauri-apps/api/core'

import { Chat } from '@/shared/types/chat/chat.type'

export const getChat = async (chatId: string) => {
  return invoke<Chat>('get_chat', {
    chatId,
  })
}
