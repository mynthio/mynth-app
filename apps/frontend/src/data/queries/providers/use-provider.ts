import { Accessor } from 'solid-js'

import { createQuery, useQuery } from '@tanstack/solid-query'

import { getProvider } from '@/data/api/providers/get-provider'

import { getChatBranch } from '../../api/chat-branches/get-chat-branch'
import {
  GET_CHAT_BRANCH_KEYS,
  GET_PROVIDER_BY_ID_KEYS,
} from '../../utils/query-keys'

interface UseChatBranchProps {
  providerId: Accessor<string>
}

export const useProvider = ({ providerId }: UseChatBranchProps) => {
  return useQuery(() => ({
    queryKey: GET_PROVIDER_BY_ID_KEYS({ providerId }),
    queryFn: () => getProvider(providerId()),
  }))
}
