import { invoke } from '@tauri-apps/api/core'

import { Branch } from '@/shared/types/branch/branch.type'

export const getBranchesByChatId = async (chatId: string) => {
  return invoke<Branch[]>('branch_get_all_by_chat_id', {
    chatId,
  })
}
