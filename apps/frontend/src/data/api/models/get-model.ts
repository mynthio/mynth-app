import { invoke } from '@tauri-apps/api/core'

import { Model } from '@/shared/types/model/model.type'

export const getModel = async (modelId: string) => {
  return invoke<Model>('get_model', { modelId })
}
