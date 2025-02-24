import { useSelector } from "@xstate/store/solid";
import { dialogStore } from "../../lib/dialogs/dialogs.store";
import { Match, Switch } from "solid-js";
import { DeleteChatDialog, DeleteChatDialogProps } from "./delete-chat.dialog";

export function DialogManager() {
  const dialog = useSelector(dialogStore, (state) => state.context.dialog);
  const props = useSelector(dialogStore, (state) => state.context.props);

  if (!dialog) return null;

  return (
    <Switch fallback={null}>
      <Match when={dialog() === "delete-chat"}>
        <DeleteChatDialog {...(props() as DeleteChatDialogProps)} />
      </Match>
    </Switch>
  );
}
