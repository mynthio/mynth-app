import { invoke } from "@tauri-apps/api/core";
import { createResource, For } from "solid-js";

export default function AiIntegrationsSettingsPage() {
  const [aiIntegrations] = createResource(async () => {
    const integrations = await invoke("get_ai_integrations");
    return integrations;
  });

  return (
    <>
      <h1>AI Integrations Settings Page</h1>

      <div class="ml-4">
        <For each={aiIntegrations()}>
          {(integration) => (
            <div>
              <h2>{integration.name}</h2>
              <p>host: {integration.baseHost}</p>
              <p>path: {integration.basePath}</p>

              <div class="ml-6">
                <For each={integration.models}>
                  {(model) => (
                    <div>
                      <p>{model.modelId}</p>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* TODO: Remove */}
      <pre class="mt-[500px]">
        <code>{JSON.stringify(aiIntegrations(), null, 2)}</code>
      </pre>
    </>
  );
}
