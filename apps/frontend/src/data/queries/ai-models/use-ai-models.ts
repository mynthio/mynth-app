import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getAiModels } from '../../api/ai-models/get-ai-models'
import { GET_AI_MODELS_KEYS } from '../../utils/query-keys'

export const useAiModels = ({
  aiIntegrationId,
}: {
  aiIntegrationId?: Accessor<string | null>
} = {}) => {
  return useQuery(() => ({
    queryKey: GET_AI_MODELS_KEYS({ aiIntegrationId }),
    queryFn: () => {
      const id = aiIntegrationId?.()
      return getAiModels(id || undefined)
    },
  }))
}
