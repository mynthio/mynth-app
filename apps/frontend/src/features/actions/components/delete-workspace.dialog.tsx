import { createMemo } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { closeActionDialog } from '..'
import { useWorkspace } from '../../../data/queries/workspaces/use-workspace'
import {
  DialogActionButton,
  DialogActions,
  DialogCloseButton,
  DialogDescription,
  DialogLabel,
  useDialog,
} from '../../../ui/dialog'

export type DELETE_WORKSPACE_EVENT_ID = 'delete-workspace'

export interface DeleteWorkspaceDialogProps {
  workspaceId: string
}

export function DeleteWorkspaceDialog(props: DeleteWorkspaceDialogProps) {
  const dialog = useDialog()
  const queryClient = useQueryClient()

  const workspaceId = createMemo(() => props.workspaceId)

  const workspace = useWorkspace({
    workspaceId,
  })

  return (
    <>
      <DialogLabel>
        Remove <i>{workspace.data?.name}</i>?
      </DialogLabel>
      <DialogDescription>
        Are you sure you want to remove <i>{workspace.data?.name}</i>? This
        action cannot be undone. All data and chats connected to this workspace
        will be permanently deleted.
      </DialogDescription>
      <DialogActions>
        <DialogCloseButton>Cancel</DialogCloseButton>
        <DialogActionButton
          onClick={() => {
            queryClient.invalidateQueries({
              queryKey: ['workspaces'],
            })

            // closeActionDialog();
            dialog.setOpen(false)
          }}
        >
          Remove
        </DialogActionButton>
      </DialogActions>
    </>
  )
}
