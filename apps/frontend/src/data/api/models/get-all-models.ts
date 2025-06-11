import { invoke } from '@tauri-apps/api/core'

import { Model } from '@/shared/types/model/model.type'

export const getAllModels = async () => {
  return invoke<Model[]>('get_all_models')
}
