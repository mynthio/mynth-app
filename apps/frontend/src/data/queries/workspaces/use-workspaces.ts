import { useQuery } from '@tanstack/solid-query'

import { getAllWorkspaces } from '../../api/workspaces/get-all-workspaces'
import { GET_WORKSPACES_KEYS } from '../../utils/query-keys'

export function useWorkspaces() {
  return useQuery(() => ({
    queryKey: GET_WORKSPACES_KEYS,
    queryFn: () => getAllWorkspaces(),
  }))
}
