import { invoke } from "@tauri-apps/api/core";

interface SetAiIntegrationApiKeyProps {
  integrationId: string;
  apiKey: string;
}

export const setAiIntegrationApiKey = async ({
  integrationId,
  apiKey,
}: SetAiIntegrationApiKeyProps) => {
  console.debug("[api|setAiIntegrationApiKey]", { integrationId });
  return invoke<void>("set_ai_integration_api_key", {
    params: {
      integrationId,
      apiKey,
    },
  });
};
