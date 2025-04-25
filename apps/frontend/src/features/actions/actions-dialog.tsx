import { Match, Switch } from "solid-js";
import { Dialog, DialogContent } from "../../ui/dialog";
import { actionsDialogState, closeActionDialog } from ".";
import {
  DeleteWorkspaceDialog,
  DeleteWorkspaceDialogProps,
} from "./components/delete-workspace.dialog";
import {
  DeleteChatDialog,
  DeleteChatDialogProps,
} from "./components/delete-chat.dialog";
import {
  DeleteChatFolderDialog,
  DeleteChatFolderDialogProps,
} from "./components/delete-chat-folder.dialog";
import {
  ModelSelectorDialog,
  ModelSelectorDialogProps,
} from "./components/model-selector.dialog";
import {
  BulkDeleteChatsDialog,
  BulkDeleteChatsDialogProps,
} from "./components/bulk-delete-chats.dialog";

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
            <DeleteWorkspaceDialog
              {...(actionsDialogState()?.payload as DeleteWorkspaceDialogProps)}
            />
          </Match>
          <Match when={actionsDialogState()?.type === "delete-chat"}>
            <DeleteChatDialog
              {...(actionsDialogState()?.payload as DeleteChatDialogProps)}
            />
          </Match>
          <Match when={actionsDialogState()?.type === "delete-chat-folder"}>
            <DeleteChatFolderDialog
              {...(actionsDialogState()
                ?.payload as DeleteChatFolderDialogProps)}
            />
          </Match>
          <Match when={actionsDialogState()?.type === "model-selector"}>
            <ModelSelectorDialog
              {...(actionsDialogState()?.payload as ModelSelectorDialogProps)}
            />
          </Match>
          <Match when={actionsDialogState()?.type === "bulk-delete-chats"}>
            <BulkDeleteChatsDialog
              {...(actionsDialogState()?.payload as BulkDeleteChatsDialogProps)}
            />
          </Match>
        </Switch>
      </DialogContent>
    </Dialog>
  );
}
