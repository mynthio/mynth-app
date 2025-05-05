import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getProviderModels } from '../../api/api/get-provider-models'
import { GET_PROVIDER_MODELS_KEYS } from '../../utils/query-keys'

type UseProviderModelsQueryProps = {
  providerId: Accessor<string>
}

export function useProviderModelsQuery({
  providerId,
}: UseProviderModelsQueryProps) {
  return useQuery(() => ({
    queryKey: GET_PROVIDER_MODELS_KEYS({ providerId }),
    queryFn: () => getProviderModels(providerId()),
  }))
}
