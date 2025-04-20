import { For } from "solid-js";
import { useProvidersQuery } from "../../../data/queries/api/use-providers-query";
import { Button } from "../../../ui/button";
import { setNavigationStore } from "../../../stores/navigation.store";

export function NewAiIntegration() {
  const providersQuery = useProvidersQuery();

  return (
    <div class="flex flex-col gap-24px">
      <For each={providersQuery.data || []}>
        {(provider) => (
          <div class="flex flex flex-col gap-10px">
            <div>
              <h3>{provider.providerName}</h3>
              <span>{provider.host}</span>
              <span>{provider.id}</span>
            </div>
            <div>
              <Button
                onClick={() => {
                  setNavigationStore("content", {
                    id: `provider_integration_settings_configure_${provider.id}`,
                    type: "settings",
                  });
                }}
              >
                Integrate
              </Button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
