import { invoke } from '@tauri-apps/api/core'

import { Chat } from '@shared/types/chat/chat.type'

export const createChat = async (workspaceId: string, parentId?: string) => {
  return invoke<Chat>('create_chat', { workspaceId, parentId })
}
