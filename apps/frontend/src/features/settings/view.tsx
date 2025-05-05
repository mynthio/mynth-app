import { Accessor, Match, Switch } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { deleteAiIntegration } from '../../data/api/ai-integrations/delete-ai-integration'
import { useAiIntegration } from '../../data/queries/ai-integrations/use-ai-integration'
import { useAiIntegrations } from '../../data/queries/ai-integrations/use-ai-integrations'
import { useAiModels } from '../../data/queries/ai-models/use-ai-models'
import { useWorkspace } from '../../data/queries/workspaces/use-workspace'
import {
  GET_AI_INTEGRATIONS_KEYS,
  GET_AI_INTEGRATION_BY_ID_KEYS,
} from '../../data/utils/query-keys'
import {
  navigationStore,
  setNavigationStore,
} from '../../stores/navigation.store'
import { Button } from '../../ui/button'
import { ChatsSettings } from './content/chats'
import { CommandsSettings } from './content/commands'
import { ConfigureProviderIntegration } from './content/configure-provider-integration'
import { GeneralSettings } from './content/general'
import { MiaSettings } from './content/mia'
import { NewAiIntegration } from './content/new-ai-integration'
import { ThemesAndCustomization } from './content/themes-and-customization'

export function View() {
  return (
    <>
      <TopBar />
      <div class="h-top-bar mt-12px" />
      <Switch
        fallback={<SettingsView id={() => navigationStore.content.id!} />}
      >
        <Match
          when={
            navigationStore.content.id!.startsWith('ai_integration_') &&
            navigationStore.content.id! !== 'ai_integration_new'
          }
        >
          <AiIntegrationView
            integrationId={() =>
              navigationStore.content.id!.replace('ai_integration_', '')
            }
          />
        </Match>
        <Match when={navigationStore.content.id!.startsWith('workspace_')}>
          <WorkspaceView
            workspaceId={() =>
              navigationStore.content.id!.replace('workspace_', '')
            }
          />
        </Match>
      </Switch>
    </>
  )
}

function TopBar() {
  return (
    <div class="flex justify-between items-center h-top-bar px-6px absolute left-0 right-4px top-0 z-50 bg-background/80 backdrop-blur-32px">
      <div class="text-ui text-[#97A6A1]">
        <Switch fallback={<>General</>}>
          <Match when={navigationStore.content.id! === 'ai_integration_new'}>
            New AI Integration
          </Match>
          <Match
            when={navigationStore.content.id!.startsWith('ai_integration_')}
          >
            <AiIntegrationName />
          </Match>
          <Match when={navigationStore.content.id!.startsWith('workspace_')}>
            <WorkspaceName />
          </Match>
          <Match when={navigationStore.content.id! === 'mia'}>Mia</Match>
          <Match
            when={navigationStore.content.id! === 'themes_and_customization'}
          >
            Themes and Customization
          </Match>
          <Match when={navigationStore.content.id! === 'chats'}>Chats</Match>
          <Match when={navigationStore.content.id! === 'commands'}>
            Commands
          </Match>
        </Switch>
      </div>
      <div>
        <button class="flex items-center justify-center size-24px cursor-default hover:bg-accent/10 rounded-8px hover:scale-105 transition-all transition-duration-300">
          <div class="i-lucide:help-circle text-ui-icon text-[#97A6A1]" />
        </button>
      </div>
    </div>
  )
}

function AiIntegrationName() {
  const aiIntegration = useAiIntegration({
    aiIntegrationId: () =>
      navigationStore.content.id!.replace('ai_integration_', ''),
  })

  return <>{aiIntegration.data?.name}</>
}

function WorkspaceName() {
  const workspace = useWorkspace({
    workspaceId: () => navigationStore.content.id!.replace('workspace_', ''),
  })

  return <>{workspace.data?.name}</>
}

function SettingsView({ id }: { id: Accessor<string> }) {
  return (
    <Switch fallback={<GeneralSettings />}>
      <Match when={id() === 'general'}>
        <GeneralSettings />
      </Match>
      <Match when={id() === 'mia'}>
        <MiaSettings />
      </Match>
      <Match when={id() === 'themes_and_customization'}>
        <ThemesAndCustomization />
      </Match>
      <Match when={id() === 'chats'}>
        <ChatsSettings />
      </Match>
      <Match when={id() === 'commands'}>
        <CommandsSettings />
      </Match>
      <Match when={id() === 'ai_integration_new'}>
        <NewAiIntegration />
      </Match>
      <Match when={id().startsWith('provider_integration_settings_configure_')}>
        <ConfigureProviderIntegration
          providerId={() =>
            id().replace('provider_integration_settings_configure_', '')
          }
        />
      </Match>
    </Switch>
  )
}

function AiIntegrationView({
  integrationId,
}: {
  integrationId: Accessor<string>
}) {
  const aiIntegration = useAiIntegration({
    aiIntegrationId: integrationId,
  })

  const queryClient = useQueryClient()

  const aiModels = useAiModels({
    aiIntegrationId: integrationId,
  })

  return (
    <div>
      <pre>{JSON.stringify(aiIntegration.data, null, 2)}</pre>
      <h6>Models</h6>
      <pre>{JSON.stringify(aiModels.data, null, 2)}</pre>
      <h6>Settings</h6>
      <Button
        onClick={() => {
          deleteAiIntegration({
            aiIntegrationId: integrationId(),
          }).then(() => {
            queryClient.invalidateQueries({
              queryKey: GET_AI_INTEGRATIONS_KEYS(),
            })
            queryClient.invalidateQueries({
              queryKey: GET_AI_INTEGRATION_BY_ID_KEYS({
                aiIntegrationId: integrationId,
              }),
            })
            setNavigationStore('content', {
              id: 'general',
              type: 'settings',
            })
          })
        }}
      >
        Delete
      </Button>
    </div>
  )
}

function WorkspaceView({ workspaceId }: { workspaceId: Accessor<string> }) {
  const workspace = useWorkspace({
    workspaceId: workspaceId,
  })

  return <div>{JSON.stringify(workspace.data)}</div>
}
