import { createEventBus } from "@solid-primitives/event-bus";
import { createSignal } from "solid-js";
import {
  APP_SETTINGS_DIALOG_EVENT_ID,
  AppSettingsDialogProps,
} from "./components/app-settings.dialog";

// Define payload types for each dialog
type AppSettingsDialogPayload = {
  id: typeof APP_SETTINGS_DIALOG_EVENT_ID;
  payload: AppSettingsDialogProps;
};

// Add other dialog payload types here as needed
// type OtherDialogPayload = {
//   id: OTHER_DIALOG_EVENT_ID;
//   payload: OtherDialogProps;
// };

// Union type for all possible event payloads
type EventBusPayload =
  | AppSettingsDialogPayload;
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
const [dialogsState, setDialogsState] = createSignal<DialogState | null>(
  null
);

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