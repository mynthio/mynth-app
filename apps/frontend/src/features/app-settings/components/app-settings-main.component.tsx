import { Component, Match, Switch } from 'solid-js'

import { useAppSettings } from '../app-settings.context'
import { AddAiIntegration } from '../pages/ai-integration/add-ai-integration'
import { AiIntegrationSettings } from '../pages/ai-integration/ai-integration.component'
import { ChatsSettings } from '../pages/chats/chats.component'
// Import page components
import { GeneralSettings } from '../pages/general/general.component'
import { LookAndFeelSettings } from '../pages/look-and-feel/look-and-feel.component'
import { WorkspaceSettings } from '../pages/workspace/workspace.component'

/**
 * The main content area for app settings
 * Renders different settings components based on the active item
 */
export const AppSettingsMain: Component = () => {
  const { activeItem } = useAppSettings()

  return (
    <main class="flex-1 px-36px overflow-auto scrollbar-app">
      <Switch fallback={<div>Select an item from the sidebar</div>}>
        <Match
          when={
            activeItem() &&
            activeItem().type === 'static' &&
            'item' in activeItem() &&
            activeItem().item === 'general'
          }
        >
          <GeneralSettings />
        </Match>
        <Match
          when={
            activeItem() &&
            activeItem().type === 'static' &&
            'item' in activeItem() &&
            activeItem().item === 'chats'
          }
        >
          <ChatsSettings />
        </Match>
        <Match
          when={
            activeItem() &&
            activeItem().type === 'static' &&
            'item' in activeItem() &&
            activeItem().item === 'look-and-feel'
          }
        >
          <LookAndFeelSettings />
        </Match>
        <Match
          when={
            activeItem() &&
            activeItem().type === 'static' &&
            'item' in activeItem() &&
            activeItem().item === 'add-ai-integration'
          }
        >
          <AddAiIntegration />
        </Match>
        <Match
          when={
            activeItem() &&
            activeItem().type === 'workspace' &&
            'id' in activeItem() &&
            activeItem().id
          }
        >
          <WorkspaceSettings id={() => activeItem()?.id} />
        </Match>
        <Match
          when={
            activeItem() &&
            activeItem().type === 'ai-integration' &&
            'id' in activeItem() &&
            activeItem().id
          }
        >
          <AiIntegrationSettings id={() => activeItem()?.id} />
        </Match>
      </Switch>
    </main>
  )
}
