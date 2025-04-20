import { createQuery, useQuery } from "@tanstack/solid-query";
import { GET_AI_INTEGRATIONS_KEYS } from "../../utils/query-keys";
import { getAiIntegrations } from "../../api/ai-integrations/get-ai-integrations";

export const useAiIntegrations = () => {
  return useQuery(() => ({
    queryKey: GET_AI_INTEGRATIONS_KEYS(),
    queryFn: () => getAiIntegrations(),
  }));
};
