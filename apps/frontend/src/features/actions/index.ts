import { createEventBus } from "@solid-primitives/event-bus";
import {
  DELETE_WORKSPACE_EVENT_ID,
  DeleteWorkspaceDialogProps,
} from "./components/delete-workspace.dialog";
import { createSignal } from "solid-js";

type EventBusPayload = {
  type: DELETE_WORKSPACE_EVENT_ID;
  payload: DeleteWorkspaceDialogProps;
};

const { listen, emit } = createEventBus<EventBusPayload>();

export { listen, emit };

type ActionsDialogState = {
  isOpen: boolean;
  type: DELETE_WORKSPACE_EVENT_ID;
  payload: DeleteWorkspaceDialogProps;
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
