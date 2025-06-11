import { invoke } from '@tauri-apps/api/core'

import { Provider } from '@/shared/types/provider/provider.type'

export const getProvider = async (id: string) => {
  return invoke<Provider>('get_provider', { id })
}
