import { Field } from '@ark-ui/solid/field'
import { TextField } from '@kobalte/core'
import { autofocus } from '@solid-primitives/autofocus'
import { createShortcut } from '@solid-primitives/keyboard'
import { debounce } from '@solid-primitives/scheduled'

import {
  Component,
  For,
  Suspense,
  createMemo,
  createSignal,
  lazy,
  onCleanup,
  onMount,
} from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { invoke } from '@tauri-apps/api/core'

import { updateBranch } from '@/data/api/branches/update-branch'
import { updateModel } from '@/data/api/models/update-model'
import { useBranch } from '@/data/queries/branches/use-branch'
import { useModels } from '@/data/queries/models/use-models'
import { useProvider } from '@/data/queries/providers/use-provider'
import { useProviders } from '@/data/queries/providers/use-providers'
import { closeDialog } from '@/features/dialogs'
import { Model } from '@/shared/types/model/model.type'

import { useAiIntegration } from '../../../data/queries/ai-integrations/use-ai-integration'
import { useAiModels } from '../../../data/queries/ai-models/use-ai-models'
import { useChatBranch } from '../../../data/queries/chat-branches/use-chat-branch'
import {
  BRANCH_KEYS,
  GET_CHAT_BRANCH_KEYS,
  MODELS_KEYS,
  MODEL_KEYS,
} from '../../../data/utils/query-keys'
import { Branch } from '../../../types'
import { AIModel } from '../../../types/models/ai'

// Assuming a component will be implemented later

export const CHAT_MODEL_SELECTION_DIALOG_EVENT_ID = 'chat-model-selection'

/**
 * Props for the ChatModelSelectionDialog component.
 * Add any necessary props here.
 */
export interface ChatModelSelectionDialogProps {
  // Add required props, like branchId or any other necessary identifiers
  branchId: string
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
  const models = useModels()
  const providers = useProviders()

  let searchRef: HTMLInputElement
  const [search, setSearch] = createSignal('')

  const modelsFiltered = createMemo(() => {
    if (!models.data) return []
    if (!search || search().length === 0) return models.data
    return models.data?.filter((model) => {
      return model.name?.toLowerCase().includes(search().toLowerCase())
    })
  })

  onMount(() => {
    searchRef!.focus()
  })

  const trigger = debounce((search: string) => {
    setSearch(search)
  }, 150)

  onCleanup(() => {
    trigger.clear()
  })

  return (
    <div class="w-full flex gap-24px">
      <div class="flex flex-shrink-0 w-240px flex-col gap-24px">
        <div>
          <h2 class="text-ui font-thin ml-4px">Providers</h2>
          <div class="mt-12px">
            <For each={providers.data || []}>
              {(provider) => (
                <button class="cursor-default px-16px h-32px text-ui hover:bg-elements-background-soft w-full text-left rounded-9px transition-colors">
                  {provider.name}
                </button>
              )}
            </For>
          </div>
        </div>

        <div>
          <h2 class="text-ui font-thin ml-4px">Capabilities</h2>
          <div class="mt-12px">
            <button class="cursor-default px-16px h-32px text-ui hover:bg-elements-background-soft w-full text-left rounded-9px transition-colors flex items-center gap-8px">
              <div class="i-lucide:brain text-ui-icon" />
              <span>Reasoning</span>
            </button>
            <button class="cursor-default px-16px h-32px text-ui hover:bg-elements-background-soft w-full text-left rounded-9px transition-colors flex items-center gap-8px">
              <div class="i-lucide:image text-ui-icon" />
              <span>Image Recognition</span>
            </button>
          </div>
        </div>
      </div>
      <div class="space-y-12px w-full">
        <div class="bg-elements-background-soft rounded-11px w-full min-h-38px">
          {/* <TextField.Root>
            <TextField.Input
              placeholder="Search models"
              class="bg-transparent w-full h-38px outline-none px-16px placeholder:text-muted/50 placeholder:italic text-ui"
            />
          </TextField.Root> */}

          <Field.Root>
            <Field.Input
              ref={searchRef!}
              autofocus
              class="bg-transparent w-full h-38px outline-none px-16px placeholder:text-muted/50 placeholder:italic text-ui"
              placeholder="Search models"
              onInput={(e) => trigger(e.target.value)}
            />
          </Field.Root>
        </div>
        <div class="w-full grid grid-cols-3 gap-12px">
          <For each={modelsFiltered() || []}>
            {(model) => <ModelTile model={model} branchId={props.branchId} />}
          </For>
        </div>
      </div>
    </div>
  )
}

const ModelTile: Component<{ model: Model; branchId: string }> = (props) => {
  const queryClient = useQueryClient()

  const provider = useProvider({
    providerId: () => props.model.provider_id!,
  })

  return (
    <div
      class="px-24px py-16px 
    bg-elements-background-soft
    rounded-11px"
    >
      <div class="flex items-center justify-between">
        <span class="text-ui-small text-muted">{provider.data?.name}</span>
        <div class="flex items-center gap-8px">
          <button
            class="cursor-default"
            onClick={() => {
              const newIsPinned = !props.model.is_pinned
              updateModel({
                id: props.model.id,
                isPinned: newIsPinned,
              }).then(() => {
                queryClient.setQueryData<Model>(
                  MODEL_KEYS({
                    modelId: () => props.model.id,
                  }),
                  (data: Model | undefined) =>
                    data ? { ...data, is_pinned: newIsPinned } : undefined
                )

                queryClient.setQueryData<Model[]>(
                  MODELS_KEYS(),
                  (data: Model[] | undefined) =>
                    data
                      ? data.map((model) =>
                          model.id === props.model.id
                            ? { ...model, is_pinned: newIsPinned }
                            : model
                        )
                      : undefined
                )
              })
            }}
          >
            <div
              class={`text-ui-icon ${
                props.model.is_pinned ? 'i-lucide:pin' : 'i-lucide:pin-off'
              }`}
            />
          </button>
          <button class="text-ui-icon text-muted">
            <div class="i-lucide:info" />
          </button>
        </div>
      </div>
      <div class="mt-1px">{props.model.name}</div>
      <div class="flex justify-between items-center gap-8px mt-8px">
        <div></div>

        <button
          onClick={() => {
            updateBranch({
              id: props.branchId,
              modelId: props.model.id,
              name: null,
            }).then(() => {
              queryClient.setQueryData<Branch>(
                BRANCH_KEYS({
                  branchId: () => props.branchId,
                }),
                (data: Branch | undefined) =>
                  data
                    ? {
                        ...data,
                        modelId: props.model.id,
                      }
                    : undefined
              )

              closeDialog()
            })
          }}
        >
          <div class="i-lucide:arrow-right text-16px" />
        </button>
      </div>
    </div>
  )
}
