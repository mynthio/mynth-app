import { For } from "solid-js";
import { useProvidersQuery } from "../../../../data/queries/api/use-providers-query";
import { GET_AI_INTEGRATIONS_KEYS } from "../../../../data/utils/query-keys";
import { invoke } from "@tauri-apps/api/core";
import { getProviderModels } from "../../../../data/api/api/get-provider-models";
import { useQueryClient } from "@tanstack/solid-query";

export function AddAiIntegration() {
  const providersQuery = useProvidersQuery();

  const queryClient = useQueryClient();
  return (
    <div>
      <h1>Add AI Integration</h1>

      <For each={providersQuery.data} fallback={<div>No providers found</div>}>
        {(provider) => (
          <>
            <pre class="mt-10px">{JSON.stringify(provider, null, 2)}</pre>
            <button
              onClick={async () => {
                const models = await getProviderModels(provider.id);

                console.log(models);

                await invoke("create_ai_integration", {
                  params: {
                    name: provider.displayName,
                    baseHost: provider.host,
                    // TODO: get base path from provider
                    basePath: provider.basePath,
                    chatCompletionPath: provider.chatCompletionPath,
                    apiKey: null,
                    models: models.map((model) => ({
                      modelId: model.modelId,
                      origin: "mynth",
                    })),
                  },
                }).then(() => {
                  queryClient.invalidateQueries({
                    queryKey: GET_AI_INTEGRATIONS_KEYS(),
                  });
                });
              }}
            >
              Integrate
            </button>
          </>
        )}
      </For>
    </div>
  );
}
