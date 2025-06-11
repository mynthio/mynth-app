import { useQuery } from '@tanstack/solid-query'

import { getAllModels } from '@/data/api/models/get-all-models'

import { MODELS_KEYS } from '../../utils/query-keys'

export const useModels = () => {
  return useQuery(() => ({
    queryKey: MODELS_KEYS(),
    queryFn: () => getAllModels(),
  }))
}
