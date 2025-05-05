import { invoke } from '@tauri-apps/api/core'

import { Chat } from '../../../types'

export const getAllChats = async (workspaceId: string) => {
  return invoke<Chat[]>('get_all_chats', {
    workspaceId,
  })
}
