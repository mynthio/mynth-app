import { useQuery } from '@tanstack/solid-query'

import { getProviders } from '../../api/api/get-providers'
import { GET_PROVIDERS_KEYS } from '../../utils/query-keys'

export function useProvidersQuery() {
  return useQuery(() => ({
    queryKey: GET_PROVIDERS_KEYS(),
    queryFn: () => getProviders(),
  }))
}
