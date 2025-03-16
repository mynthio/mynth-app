import { Match, Switch } from "solid-js";
import { Dialog, DialogContent } from "../../ui/dialog";
import { actionsDialogState, closeActionDialog } from ".";
import { DeleteWorkspaceDialog } from "./components/delete-workspace.dialog";

export function ActionsDialog() {
  return (
    <Dialog
      open={actionsDialogState()?.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeActionDialog();
        }
      }}
      noOutsidePointerEvents={false}
    >
      <DialogContent>
        <Switch>
          <Match when={actionsDialogState()?.type === "delete-workspace"}>
            <DeleteWorkspaceDialog {...actionsDialogState()?.payload!} />
          </Match>
        </Switch>
      </DialogContent>
    </Dialog>
  );
}
