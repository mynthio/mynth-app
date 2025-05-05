import { invoke } from '@tauri-apps/api/core'

import { AIIntegration } from '../../../types'

export const getAiIntegrations = async () => {
  console.debug('[api|getAiIntegrations]')
  return invoke<AIIntegration[]>('get_ai_integrations')
}
