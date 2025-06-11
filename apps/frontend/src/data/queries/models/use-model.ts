import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getModel } from '@/data/api/models/get-model'

import { MODEL_KEYS } from '../../utils/query-keys'

export const useModel = ({ modelId }: { modelId: Accessor<string> }) => {
  return useQuery(() => ({
    queryKey: MODEL_KEYS({ modelId }),
    queryFn: () => getModel(modelId()),
  }))
}
