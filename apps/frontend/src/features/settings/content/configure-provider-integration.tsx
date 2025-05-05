import { TextField } from '@kobalte/core/text-field'

import { Accessor, createMemo, createSignal } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { invoke } from '@tauri-apps/api/core'

import { useProviderModelsQuery } from '../../../data/queries/api/use-provider-models-query'
import { useProvidersQuery } from '../../../data/queries/api/use-providers-query'
import { GET_AI_INTEGRATIONS_KEYS } from '../../../data/utils/query-keys'
import { Button } from '../../../ui/button'

type ConfigureProviderIntegrationProps = {
  providerId: Accessor<string>
}

export function ConfigureProviderIntegration({
  providerId,
}: ConfigureProviderIntegrationProps) {
  const providerModelsQuery = useProviderModelsQuery({
    providerId,
  })

  const providersQuery = useProvidersQuery()

  const provider = createMemo(() => {
    return providersQuery.data?.find((provider) => provider.id === providerId())
  })

  const [apiKey, setApiKey] = createSignal('')

  const queryClient = useQueryClient()

  return (
    <div>
      <h1>Configure Provider Integration with {provider()?.providerName}</h1>

      <TextField>
        <TextField.Label>Host</TextField.Label>
        <TextField.Input disabled name="host" value={provider()?.host} />
      </TextField>

      <TextField value={apiKey()} onChange={setApiKey}>
        <TextField.Label>API Key</TextField.Label>
        <TextField.Input name="apiKey" placeholder="Enter your API key" />
      </TextField>

      <div>
        <h2>Models</h2>
        <pre>{JSON.stringify(providerModelsQuery.data, null, 2)}</pre>
      </div>

      <Button
        onClick={() => {
          invoke('create_ai_integration', {
            params: {
              name: provider()?.providerName,
              baseHost: provider()?.host,
              // TODO: get base path from provider
              basePath: '/some/path/todo',
              apiKey: apiKey(),
              models: providerModelsQuery.data?.map((model) => ({
                modelId: model.providerModelId,
                origin: 'mynth',
              })),
            },
          }).then(() => {
            queryClient.invalidateQueries({
              queryKey: GET_AI_INTEGRATIONS_KEYS(),
            })
          })
        }}
      >
        Yeah, let's do it!
      </Button>
    </div>
  )
}
