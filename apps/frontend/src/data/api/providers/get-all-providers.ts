import { invoke } from '@tauri-apps/api/core'

import { Provider } from '@/shared/types/provider/provider.type'

export const getAllProviders = async () => {
  return invoke<Provider[]>('get_all_providers')
}
