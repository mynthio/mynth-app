import { createMemo } from 'solid-js'

import { useQueryClient } from '@tanstack/solid-query'

import { invoke } from '@tauri-apps/api/core'

import { closeActionDialog } from '..'
import { deleteChatFolder } from '../../../data/api/chat-folders/delete-chat-folder'
import { useChatFolder } from '../../../data/queries/chat-folders/use-chat-folder'
import {
  GET_CHAT_FOLDERS_KEYS,
  GET_CHAT_FOLDER_KEYS,
} from '../../../data/utils/query-keys'
import { navigationStore } from '../../../stores/navigation.store'
import {
  DialogActionButton,
  DialogActions,
  DialogCloseButton,
  DialogDescription,
  DialogLabel,
  useDialog,
} from '../../../ui/dialog'

export type DELETE_CHAT_FOLDER_EVENT_ID = 'delete-chat-folder'

export interface DeleteChatFolderDialogProps {
  folderId: string
}

export function DeleteChatFolderDialog(props: DeleteChatFolderDialogProps) {
  const dialog = useDialog()
  const queryClient = useQueryClient()

  const folderId = createMemo(() => props.folderId)

  const folder = useChatFolder({
    folderId,
  })

  const handleDelete = async () => {
    try {
      await deleteChatFolder(folderId())

      // Invalidate folder query
      queryClient.invalidateQueries({
        queryKey: GET_CHAT_FOLDER_KEYS({ folderId }),
      })

      // Invalidate folders queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: GET_CHAT_FOLDERS_KEYS({
          workspaceId: () => navigationStore.workspace.id,
        }),
      })

      dialog.setOpen(false)
    } catch (error) {
      console.error('Failed to delete folder:', error)
      // Here you might want to show an error notification to the user
    }
  }

  return (
    <>
      <DialogLabel>
        Delete folder <i>{folder.data?.name}</i>?
      </DialogLabel>
      <DialogDescription>
        Are you sure you want to delete the folder <i>{folder.data?.name}</i>?
        This action cannot be undone. All chats in this folder and any
        subfolders will also be permanently deleted.
      </DialogDescription>
      <DialogActions>
        <DialogCloseButton>Cancel</DialogCloseButton>
        <DialogActionButton onClick={handleDelete}>Delete</DialogActionButton>
      </DialogActions>
    </>
  )
}
