import { useQuery } from "@tanstack/solid-query";
import { GET_PROVIDERS_KEYS } from "../../utils/query-keys";
import { getProviders } from "../../api/api/get-providers";

export function useProvidersQuery() {
  return useQuery(() => ({
    queryKey: GET_PROVIDERS_KEYS(),
    queryFn: () => getProviders(),
  }));
}
