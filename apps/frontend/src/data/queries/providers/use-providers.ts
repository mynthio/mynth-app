import { useQuery } from '@tanstack/solid-query'

import { getAllProviders } from '@/data/api/providers/get-all-providers'

import { PROVIDER_KEYS } from '../../utils/query-keys'

export const useProviders = () => {
  return useQuery(() => ({
    queryKey: PROVIDER_KEYS(),
    queryFn: () => getAllProviders(),
  }))
}
