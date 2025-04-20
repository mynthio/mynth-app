import { Accessor } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { GET_AI_INTEGRATION_BY_ID_KEYS } from "../../utils/query-keys";
import { getAiIntegration } from "../../api/ai-integrations/get-ai-integration";

interface UseAiIntegrationProps {
  aiIntegrationId: Accessor<string>;
}

export const useAiIntegration = ({
  aiIntegrationId,
}: UseAiIntegrationProps) => {
  return createQuery(() => ({
    queryKey: GET_AI_INTEGRATION_BY_ID_KEYS({ aiIntegrationId }),
    queryFn: () => getAiIntegration({ aiIntegrationId: aiIntegrationId() }),
  }));
};
