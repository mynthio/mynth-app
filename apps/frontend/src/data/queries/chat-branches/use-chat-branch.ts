import { Accessor } from 'solid-js'

import { createQuery } from '@tanstack/solid-query'

import { getChatBranch } from '../../api/chat-branches/get-chat-branch'
import { GET_CHAT_BRANCH_KEYS } from '../../utils/query-keys'

interface UseChatBranchProps {
  branchId: Accessor<string>
}

export const useChatBranch = ({ branchId }: UseChatBranchProps) => {
  return createQuery(() => ({
    queryKey: GET_CHAT_BRANCH_KEYS({ branchId }),
    queryFn: () => getChatBranch(branchId()),
  }))
}
