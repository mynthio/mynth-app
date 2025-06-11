import { TextField } from '@kobalte/core'

import { Accessor, Component } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { invoke } from '@tauri-apps/api/core'

import { useProvider } from '@/data/queries/providers/use-provider'

import { deleteAiIntegration } from '../../../../data/api/ai-integrations/delete-ai-integration'
import { setAiIntegrationApiKey } from '../../../../data/api/ai-integrations/set-ai-integration-api-key'
import { useAiIntegration } from '../../../../data/queries/ai-integrations/use-ai-integration'
import { useAiModels } from '../../../../data/queries/ai-models/use-ai-models'
import {
  GET_AI_INTEGRATIONS_KEYS,
  GET_AI_INTEGRATION_BY_ID_KEYS,
} from '../../../../data/utils/query-keys'
import { useAppSettings } from '../../app-settings.context'

/**
 * AI Integration settings page component
 * Contains settings for managing AI service integrations
 */
export const AiIntegrationSettings: Component<{ id: Accessor<string> }> = (
  props
) => {
  const provider = useProvider({
    providerId: props.id,
  })
  const models = useAiModels({
    aiIntegrationId: props.id,
  })

  return (
    <div>
      <h2 class="text-xl font-semibold mb-2">{provider.data?.name}</h2>
      <p class="text-muted mb-4">ID: {props.id()}</p>

      <ApiKeyForm id={props.id} />

      <code>
        <pre>{JSON.stringify(provider.data, null, 2)}</pre>
      </code>
      <h2>Models</h2>
      <code>
        <pre>{JSON.stringify(models.data, null, 2)}</pre>
      </code>
      <DeleteAiIntegrationForm id={props.id} />
    </div>
  )
}

const ApiKeyForm: Component<{ id: Accessor<string> }> = (props) => {
  const queryClient = useQueryClient()

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const apiKey = formData.get('apiKey')

    invoke('update_provider_api_key', {
      providerId: props.id(),
      apiKey: apiKey as string,
    })

    queryClient.invalidateQueries({
      queryKey: GET_AI_INTEGRATION_BY_ID_KEYS({
        aiIntegrationId: props.id,
      }),
    })
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <form onSubmit={onSubmit} class="my-24px max-w-400px">
      <TextField.Root name="apiKey">
        <TextField.Label>API Key</TextField.Label>
        <TextField.Input
          required
          minLength={1}
          type="password"
          placeholder="Enter your API key"
          class="bg-elements-background-soft border-elements-background rounded-8px h-38px px-12px w-full text-ui placeholder:text-muted text-active outline-transparent focus-visible:outline-white"
        />
      </TextField.Root>
      <button
        class="h-button px-12px bg-elements-background-soft border-elements-background rounded-8px text-ui mt-4px"
        type="submit"
      >
        Save
      </button>
    </form>
  )
}

const DeleteAiIntegrationForm: Component<{ id: Accessor<string> }> = (
  props
) => {
  const { setActiveItem } = useAppSettings()
  const queryClient = useQueryClient()
  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault()

    deleteAiIntegration({
      aiIntegrationId: props.id(),
    }).then(() => {
      queryClient.removeQueries({
        queryKey: GET_AI_INTEGRATION_BY_ID_KEYS({
          aiIntegrationId: props.id,
        }),
      })

      queryClient.invalidateQueries({
        queryKey: GET_AI_INTEGRATIONS_KEYS(),
      })

      setActiveItem({ type: 'static', item: 'add-ai-integration' })
    })
  }

  return (
    <form onSubmit={onSubmit} class="my-24px max-w-400px">
      <button type="submit">Delete</button>
    </form>
  )
}
