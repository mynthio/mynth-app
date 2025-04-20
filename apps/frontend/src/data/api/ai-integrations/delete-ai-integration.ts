import { invoke } from "@tauri-apps/api/core";

interface DeleteAiIntegrationProps {
  aiIntegrationId: string;
}

export const deleteAiIntegration = async ({
  aiIntegrationId,
}: DeleteAiIntegrationProps) => {
  console.debug("[api|deleteAiIntegration]", { aiIntegrationId });
  return invoke<boolean>("delete_ai_integration", { id: aiIntegrationId });
};
