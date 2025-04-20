import { createEventBus } from "@solid-primitives/event-bus";
import {
  DELETE_WORKSPACE_EVENT_ID,
  DeleteWorkspaceDialogProps,
} from "./components/delete-workspace.dialog";
import {
  DELETE_CHAT_EVENT_ID,
  DeleteChatDialogProps,
} from "./components/delete-chat.dialog";
import {
  DELETE_CHAT_FOLDER_EVENT_ID,
  DeleteChatFolderDialogProps,
} from "./components/delete-chat-folder.dialog";
import { createSignal } from "solid-js";
import {
  MODEL_SELECTOR_EVENT_ID,
  ModelSelectorDialogProps,
} from "./components/model-selector.dialog";

type ModelSelectorPayload = {
  id: MODEL_SELECTOR_EVENT_ID;
  payload: ModelSelectorDialogProps;
};

type DeleteWorkspacePayload = {
  id: DELETE_WORKSPACE_EVENT_ID;
  payload: DeleteWorkspaceDialogProps;
};

type DeleteChatPayload = {
  id: DELETE_CHAT_EVENT_ID;
  payload: DeleteChatDialogProps;
};

type DeleteChatFolderPayload = {
  id: DELETE_CHAT_FOLDER_EVENT_ID;
  payload: DeleteChatFolderDialogProps;
};

type EventBusPayload =
  | ModelSelectorPayload
  | DeleteWorkspacePayload
  | DeleteChatPayload
  | DeleteChatFolderPayload;

const { listen, emit } = createEventBus<EventBusPayload>();

export { listen, emit };

type ActionsDialogState = {
  isOpen: boolean;
  type: EventBusPayload["id"];
  payload: EventBusPayload["payload"];
};

const [state, setState] = createSignal<ActionsDialogState | null>(null);

const openActionDialog = (
  type: ActionsDialogState["type"],
  payload: ActionsDialogState["payload"]
) => {
  setState({
    isOpen: true,
    type,
    payload,
  });
};

const closeActionDialog = () => {
  setState((prev: any) => ({
    ...(prev as any),
    isOpen: false,
  }));
};

export { openActionDialog, closeActionDialog, state as actionsDialogState };
