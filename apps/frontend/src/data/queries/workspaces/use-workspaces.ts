import { createQuery } from "@tanstack/solid-query";
import { GET_WORKSPACES_KEYS } from "../../utils/query-keys";
import { getWorkspaces } from "../../api/workspaces/get-workspaces";

export function useWorkspaces() {
  return createQuery(() => ({
    queryKey: GET_WORKSPACES_KEYS,
    queryFn: () => getWorkspaces(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }));
}
