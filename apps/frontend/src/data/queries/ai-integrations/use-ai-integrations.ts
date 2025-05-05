import { createQuery, useQuery } from '@tanstack/solid-query'

import { getAiIntegrations } from '../../api/ai-integrations/get-ai-integrations'
import { GET_AI_INTEGRATIONS_KEYS } from '../../utils/query-keys'

export const useAiIntegrations = () => {
  return useQuery(() => ({
    queryKey: GET_AI_INTEGRATIONS_KEYS(),
    queryFn: () => getAiIntegrations(),
  }))
}
