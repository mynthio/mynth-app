import { Match, Switch } from "solid-js";
import { Dialog, DialogContent } from "../../ui/dialog";
import { dialogsState, closeDialog } from ".";
import {
  AppSettingsDialog,
  AppSettingsDialogProps,
} from "./components/app-settings.dialog";

export function DialogsDialog() {
  return (
    <Dialog
      open={dialogsState()?.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
      noOutsidePointerEvents={false} // Adjust as needed for larger dialogs
    >
      <DialogContent class="w-full max-w-80% h-full max-h-80%">
        {" "}
        {/* Example: Larger width */}
        <Switch>
          <Match when={dialogsState()?.type === "app-settings"}>
            <AppSettingsDialog
              {...(dialogsState()?.payload as AppSettingsDialogProps)}
            />
          </Match>
          {/* Add Match cases for other dialog types here */}
          {/* <Match when={dialogsState()?.type === "other-dialog"}>
            <OtherDialog
              {...(dialogsState()?.payload as OtherDialogProps)}
            />
          </Match> */}
        </Switch>
      </DialogContent>
    </Dialog>
  );
}
