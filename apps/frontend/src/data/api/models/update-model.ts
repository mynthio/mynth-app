import { invoke } from '@tauri-apps/api/core'

import { UpdateModelPublic } from '@/shared/types/model/update-model.type'

export const updateModel = async (payload: UpdateModelPublic) => {
  return invoke('update_model', { payload })
}
