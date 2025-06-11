import { For, Show, createMemo } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { updateBranch } from '@/data/api/branches/update-branch'
import { useModels } from '@/data/queries/models/use-models'
import { BRANCH_KEYS } from '@/data/utils/query-keys'
import { closeDialog } from '@/features/dialogs'
import { Branch } from '@/shared/types/branch/branch.type'

import { ContextMenuPayload } from '..'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../ui/dropdown-menu'

interface ChatAiModelButtonContextMenuProps {
  payload: ContextMenuPayload
}

/**
 * Context menu for the chat AI model button
 * Provides options to select, configure or get info about AI models
 */
export function ChatAiModelButtonContextMenu(
  props: ChatAiModelButtonContextMenuProps
) {
  const queryClient = useQueryClient()
  const models = useModels()

  const pinnedModels = createMemo(() => {
    return models.data?.filter((model) => model.is_pinned)
  })

  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log('Select model', props.payload.id)}
      >
        Select Model
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Configure model', props.payload.id)}
      >
        Configure Settings
      </DropdownMenuItem>
      <Show when={pinnedModels()?.length}>
        <DropdownMenuSeparator />

        <For each={pinnedModels()}>
          {(model) => (
            <DropdownMenuItem
              onSelect={() => {
                const branchId = props.payload.id
                updateBranch({
                  id: branchId,
                  modelId: model.id,
                  name: null,
                }).then(() => {
                  queryClient.setQueryData<Branch>(
                    BRANCH_KEYS({
                      branchId: () => branchId,
                    }),
                    (data: Branch | undefined) =>
                      data
                        ? {
                            ...data,
                            modelId: model.id,
                          }
                        : undefined
                  )
                })
              }}
            >
              {model.display_name}
            </DropdownMenuItem>
          )}
        </For>
      </Show>
    </>
  )
}
