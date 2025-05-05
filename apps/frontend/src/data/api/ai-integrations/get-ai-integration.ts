import { invoke } from '@tauri-apps/api/core'

import { AIIntegration } from '../../../types'

interface GetAiIntegrationProps {
  aiIntegrationId: string
}

export const getAiIntegration = async ({
  aiIntegrationId,
}: GetAiIntegrationProps) => {
  console.debug('[api|getAiIntegration]', { aiIntegrationId })
  return invoke<AIIntegration | null>('get_ai_integration', {
    id: aiIntegrationId,
  })
}
