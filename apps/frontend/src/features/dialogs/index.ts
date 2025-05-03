import { createEventBus } from "@solid-primitives/event-bus";
import { createSignal } from "solid-js";
import {
  APP_SETTINGS_DIALOG_EVENT_ID,
  AppSettingsDialogProps,
} from "./components/app-settings.dialog";
import {
  CHAT_SYSTEM_PROMPT_DIALOG_EVENT_ID,
  ChatSystemPromptDialogProps,
} from "./components/chat-system-prompt-dialog";
import {
  CHAT_MODEL_SELECTION_DIALOG_EVENT_ID,
  ChatModelSelectionDialogProps,
} from "./components/chat-model-selection-dialog";

// Define payload types for each dialog
type AppSettingsDialogPayload = {
  id: typeof APP_SETTINGS_DIALOG_EVENT_ID;
  payload: AppSettingsDialogProps;
};

type ChatSystemPromptDialogPayload = {
  id: typeof CHAT_SYSTEM_PROMPT_DIALOG_EVENT_ID;
  payload: ChatSystemPromptDialogProps;
};

type ChatModelSelectionDialogPayload = {
  id: typeof CHAT_MODEL_SELECTION_DIALOG_EVENT_ID;
  payload: ChatModelSelectionDialogProps;
};

// Add other dialog payload types here as needed
// type OtherDialogPayload = {
//   id: OTHER_DIALOG_EVENT_ID;
//   payload: OtherDialogProps;
// };

// Union type for all possible event payloads
type EventBusPayload =
  | AppSettingsDialogPayload
  | ChatSystemPromptDialogPayload
  | ChatModelSelectionDialogPayload;
// | OtherDialogPayload;

// Create the event bus
const dialogEventBus = createEventBus<EventBusPayload>();

// Define the state structure for the dialog
type DialogState = {
  isOpen: boolean;
  type: EventBusPayload["id"] | null;
  payload: EventBusPayload["payload"] | null;
};

// Create the signal for the dialog state
const [dialogsState, setDialogsState] = createSignal<DialogState | null>(null);

// Subscribe to the event bus to open dialogs
dialogEventBus.listen((event) => {
  setDialogsState({
    isOpen: true,
    type: event.id,
    payload: event.payload,
  });
});

// Helper function to open a dialog
export function openDialog<T extends EventBusPayload>(payload: T) {
  dialogEventBus.emit(payload);
}

// Helper function to close the currently open dialog
export function closeDialog() {
  setDialogsState((prev) => (prev ? { ...prev, isOpen: false } : null));

  // Reset state after a short delay to allow for closing animation
  setTimeout(() => {
    setDialogsState(null);
  }, 300);
}

// Export the state signal
export { dialogsState };

// Export the type and component for the ChatSystemPromptDialog
export type { ChatSystemPromptDialogProps } from "./components/chat-system-prompt-dialog";
export { ChatSystemPromptDialog } from "./components/chat-system-prompt-dialog";

// Export the type and component for the ChatModelSelectionDialog
export type { ChatModelSelectionDialogProps } from "./components/chat-model-selection-dialog";
export { ChatModelSelectionDialog } from "./components/chat-model-selection-dialog";
