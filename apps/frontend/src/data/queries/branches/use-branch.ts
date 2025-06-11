import { Accessor } from 'solid-js'

import { useQuery } from '@tanstack/solid-query'

import { getBranch } from '@/data/api/branches/get-branch'
import { BRANCH_KEYS } from '@/data/utils/query-keys'

export const useBranch = ({ branchId }: { branchId: Accessor<string> }) => {
  return useQuery(() => ({
    queryKey: BRANCH_KEYS({ branchId }),
    queryFn: () => getBranch(branchId()),
  }))
}
