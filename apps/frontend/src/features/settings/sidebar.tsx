import { For, Show } from 'solid-js'

import { TopBar, TopBarTitle } from '../../components/sidebar/sidebar-top-bar'
import { useAiIntegrations } from '../../data/queries/ai-integrations/use-ai-integrations'
import { useWorkspaces } from '../../data/queries/workspaces/use-workspaces'
import {
  navigationStore,
  setNavigationStore,
} from '../../stores/navigation.store'

export function SettingsSidebar() {
  return (
    <>
      <TopBar>
        <TopBarTitle icon="i-lucide:bolt">Settings</TopBarTitle>
      </TopBar>

      <div class="px-4px overflow-y-auto h-[calc(100%-var(--top-bar-height))] pb-24px scrollbar-app">
        <div class="flex flex-col gap-1px">
          <Item
            item={{ id: 'general', name: 'General', icon: 'i-lucide:bolt' }}
          />
          <Item item={{ id: 'mia', name: 'Mia', icon: 'i-lucide:sparkles' }} />
          <Item
            item={{
              id: 'themes_and_customization',
              name: 'Themes and Customization',
              icon: 'i-lucide:palette',
            }}
          />
          <Item
            item={{
              id: 'chats',
              name: 'Chats',
              icon: 'i-lucide:message-circle',
            }}
          />
          <Item
            item={{
              id: 'commands',
              name: 'Commands',
              icon: 'i-lucide:zap',
            }}
          />
        </div>

        <div class="mt-16px">
          <div class="flex items-center justify-between px-8px">
            <h2 class="text-[#B9C4C0]/70 text-ui w-auto font-100">
              AI Integrations
            </h2>
          </div>

          <div class="flex flex-col gap-1px mt-12px">
            <AiIntegrationsItems />
          </div>
        </div>

        <div class="mt-16px">
          <div class="flex items-center justify-between pr-8px">
            <h2 class="text-[#B9C4C0]/70 text-ui font-100 px-20px">
              Workspaces
            </h2>

            <button
              class="text-ui-icon size-24px cursor-default hover:scale-110 active:scale-105 transition-all flex items-center justify-center"
              onClick={() => {
                setNavigationStore('content', {
                  id: 'ai_integration_new',
                })
              }}
            >
              <div class="i-lucide:plus" />
            </button>
          </div>

          <div class="flex flex-col gap-1px mt-12px">
            <WorkspacesItems />
          </div>
        </div>
      </div>
    </>
  )
}

function AiIntegrationsItems() {
  const aiIntegrations = useAiIntegrations()

  return (
    <>
      <For
        each={aiIntegrations.data}
        fallback={<div>Add first integration</div>}
      >
        {(item) => (
          <Item
            item={{
              id: `ai_integration_${item.id}`,
              name: item.name,
              icon: 'i-lucide:brain',
            }}
          />
        )}
      </For>
      <Item
        item={{
          id: `ai_integration_new`,
          name: 'Add new',
          icon: 'i-lucide:plus',
        }}
      />
    </>
  )
}

function WorkspacesItems() {
  const workspaces = useWorkspaces()

  return (
    <>
      <For each={workspaces.data}>
        {(item) => (
          <Item
            item={{
              id: `workspace_${item.id}`,
              name: item.name,
              icon: 'i-lucide:layers',
            }}
          />
        )}
      </For>
    </>
  )
}

type ItemProps = {
  item: {
    id: string
    name: string
    icon: string
  }
}

function Item(props: ItemProps) {
  return (
    <button
      class="text-left text-ui h-26px leading-tight transition-duration-200ms transition-colors bg-accent/0 flex items-center gap-2 truncate px-16px hover:bg-accent/5 rounded-6px cursor-default"
      classList={{
        'bg-accent/5 text-active': props.item.id === navigationStore.content.id,
        'text-[#B9C4C0]': props.item.id !== navigationStore.content.id,
      }}
      onClick={(e) => {
        setNavigationStore('content', {
          id: props.item.id,
          type: 'settings',
        })
      }}
    >
      <div class={[props.item.icon, 'text-ui-icon flex-shrink-0'].join(' ')} />
      <span class="truncate">{props.item.name}</span>
    </button>
  )
}
