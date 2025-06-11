import { invoke } from '@tauri-apps/api/core'

import { UpdateChat } from '@/shared/types/chat/update-chat.type'

export const updateChat = async (payload: UpdateChat) => {
  return invoke<void>('update_chat', { payload })
}
