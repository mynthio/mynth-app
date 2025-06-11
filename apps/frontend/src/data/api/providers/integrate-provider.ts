import { invoke } from '@tauri-apps/api/core'

export const integrateProvider = async (marketplaceProviderId: string) => {
  return invoke<string>('integrate_provider', { marketplaceProviderId })
}
