import { Portal } from "solid-js/web";
import { Dialog } from "@ark-ui/solid/dialog";
import { dialogStore } from "../../lib/dialogs/dialogs.store";

export type DeleteChatDialogProps = {
  chatId: string;
};

export function DeleteChatDialog(props: DeleteChatDialogProps) {
  return (
    <Dialog.Root
      open
      lazyMount
      unmountOnExit
      onOpenChange={() => {
        dialogStore.send({
          type: "close",
        });
      }}
    >
      <Portal>
        <Dialog.Backdrop class="bg-black/5 backdrop-blur-[6px] rounded-window fixed top-0 left-0 bottom-0 right-0" />
        {/* <Dialog.Backdrop class="bg-gradient-to-t from-stone-900/90 to-stone-800/80 backdrop-blur-[1px] rounded-window fixed top-0 left-0 bottom-0 right-0" /> */}
        <Dialog.Positioner class="fixed inset-0 flex items-center justify-center top-0">
          <Dialog.Content class="bg-stone-900 rounded-[8px] p-[30px] min-w-[400px] shadow-2xl shadow-stone-950/10 border border-solid border-stone-800">
            {/* <Dialog.Content class="bg-stone-800 rounded-[8px] p-[30px] min-w-[400px] shadow-2xl shadow-stone-950/10 border border-solid border-stone-700"></Dialog.Content> */}
            <Dialog.Title>Dialog Title</Dialog.Title>
            <Dialog.Description>Dialog Description</Dialog.Description>
            <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
