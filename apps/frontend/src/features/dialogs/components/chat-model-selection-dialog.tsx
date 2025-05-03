import { Component, For, lazy, Suspense } from "solid-js";
import { useAiModels } from "../../../data/queries/ai-models/use-ai-models";
import { invoke } from "@tauri-apps/api/core";
import { AIModel } from "../../../types/models/ai";
import { useAiIntegration } from "../../../data/queries/ai-integrations/use-ai-integration";
import { useChatBranch } from "../../../data/queries/chat-branches/use-chat-branch";
import { useQueryClient } from "@tanstack/solid-query";
import { GET_CHAT_BRANCH_KEYS } from "../../../data/utils/query-keys";
import { Branch } from "../../../types";

// Assuming a component will be implemented later

export const CHAT_MODEL_SELECTION_DIALOG_EVENT_ID = "chat-model-selection";

/**
 * Props for the ChatModelSelectionDialog component.
 * Add any necessary props here.
 */
export interface ChatModelSelectionDialogProps {
  // Add required props, like branchId or any other necessary identifiers
  branchId: string;
}

/**
 * ChatModelSelectionDialog Component
 *
 * This dialog allows users to select and configure the chat model to use.
 * Great for switching between different LLM providers or model versions!
 */
export const ChatModelSelectionDialog: Component<
  ChatModelSelectionDialogProps
> = (props) => {
  const aiModels = useAiModels();
  const branch = useChatBranch({
    branchId: () => props.branchId,
  });

  const queryClient = useQueryClient();

  return (
    <div class="w-full flex flex-col gap-24px">
      <h2 class="text-2xl font-bold">Select Chat Model</h2>

      <div>{JSON.stringify(branch.data, null, 2)}</div>

      <For each={aiModels?.data || []}>
        {(model) => (
          <button
            class="h-button bg-elements-background"
            onClick={() => {
              invoke("update_chat_branch", {
                branchId: props.branchId,
                params: {
                  modelId: model.id,
                },
              }).then(() => {
                queryClient.setQueryData<Branch>(
                  GET_CHAT_BRANCH_KEYS({
                    branchId: () => props.branchId,
                  }),
                  (data: any) => ({
                    ...data,
                    modelId: model.id,
                  })
                );
              });
            }}
          >
            <ModelTile model={model} />
          </button>
        )}
      </For>
    </div>
  );
};

const ModelTile: Component<{ model: AIModel }> = (props) => {
  const aiIntegration = useAiIntegration({
    aiIntegrationId: () => props.model.integrationId,
  });

  return (
    <div>
      <div>
        {aiIntegration.data?.name}/ {props.model.modelId}
      </div>
    </div>
  );
};
