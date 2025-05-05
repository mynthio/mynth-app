import { createEventBus } from '@solid-primitives/event-bus'

import { createSignal } from 'solid-js'

import {
  BULK_DELETE_CHATS_EVENT_ID,
  BulkDeleteChatsDialogProps,
} from './components/bulk-delete-chats.dialog'
import {
  DELETE_CHAT_FOLDER_EVENT_ID,
  DeleteChatFolderDialogProps,
} from './components/delete-chat-folder.dialog'
import {
  DELETE_CHAT_EVENT_ID,
  DeleteChatDialogProps,
} from './components/delete-chat.dialog'
import {
  DELETE_WORKSPACE_EVENT_ID,
  DeleteWorkspaceDialogProps,
} from './components/delete-workspace.dialog'
import {
  MODEL_SELECTOR_EVENT_ID,
  ModelSelectorDialogProps,
} from './components/model-selector.dialog'

type ModelSelectorPayload = {
  id: MODEL_SELECTOR_EVENT_ID
  payload: ModelSelectorDialogProps
}

type DeleteWorkspacePayload = {
  id: DELETE_WORKSPACE_EVENT_ID
  payload: DeleteWorkspaceDialogProps
}

type DeleteChatPayload = {
  id: DELETE_CHAT_EVENT_ID
  payload: DeleteChatDialogProps
}

type DeleteChatFolderPayload = {
  id: DELETE_CHAT_FOLDER_EVENT_ID
  payload: DeleteChatFolderDialogProps
}

type BulkDeleteChatsPayload = {
  id: BULK_DELETE_CHATS_EVENT_ID
  payload: BulkDeleteChatsDialogProps
}

type EventBusPayload =
  | ModelSelectorPayload
  | DeleteWorkspacePayload
  | DeleteChatPayload
  | DeleteChatFolderPayload
  | BulkDeleteChatsPayload

const { listen, emit } = createEventBus<EventBusPayload>()

type ActionsDialogState = {
  isOpen: boolean
  type: EventBusPayload['id']
  payload: EventBusPayload['payload']
}

const [state, setState] = createSignal<ActionsDialogState | null>(null)

const openActionDialog = (
  type: ActionsDialogState['type'],
  payload: ActionsDialogState['payload']
) => {
  setState({
    isOpen: true,
    type,
    payload,
  })
}

const closeActionDialog = () => {
  setState((prev: any) => ({
    ...(prev as any),
    isOpen: false,
  }))
}

export { openActionDialog, closeActionDialog, state as actionsDialogState }
