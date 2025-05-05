import { invoke } from '@tauri-apps/api/core'

import { AIModel } from '../../../types'

export const getAiModels = async (aiIntegrationId?: string) => {
  console.debug(
    '[api|getAiModels]',
    aiIntegrationId ? `for integration: ${aiIntegrationId}` : 'all models'
  )

  return invoke<AIModel[]>('get_ai_models', {
    aiIntegrationId: aiIntegrationId,
  })
}
