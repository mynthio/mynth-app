import {
  DialogActionButton,
  DialogActions,
  DialogCloseButton,
  DialogDescription,
  DialogLabel,
  useDialog,
} from "../../../ui/dialog";
import { useQueryClient } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { closeActionDialog } from "..";
import { invoke } from "@tauri-apps/api/core";
import { GET_CHAT_KEYS, GET_CHATS_KEYS } from "../../../data/utils/query-keys";
import { navigationStore } from "../../../stores/navigation.store";

export type BULK_DELETE_CHATS_EVENT_ID = "bulk-delete-chats";

export interface BulkDeleteChatsDialogProps {
  chatIds: string[];
}

export function BulkDeleteChatsDialog(props: BulkDeleteChatsDialogProps) {
  const dialog = useDialog();
  const queryClient = useQueryClient();

  const chatIds = createMemo(() => props.chatIds);

  const handleDelete = async () => {
    try {
      // TODO: This should be moved to a single Tauri command that handles bulk deletion
      // instead of deleting each chat individually for better performance
      for (const chatId of chatIds()) {
        await invoke("delete_chat", { chatId });
      }

      // Invalidate individual chat queries
      for (const chatId of chatIds()) {
        queryClient.invalidateQueries({
          queryKey: GET_CHAT_KEYS({ chatId: () => chatId }),
        });
      }

      // Invalidate chats list queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: GET_CHATS_KEYS({
          workspaceId: () => navigationStore.workspace.id,
        }),
      });

      dialog.setOpen(false);
    } catch (error) {
      console.error("Failed to delete chats:", error);
      // Here you might want to show an error notification to the user
    }
  };

  return (
    <>
      <DialogLabel>Delete multiple chats?</DialogLabel>
      <DialogDescription>
        Are you sure you want to delete {chatIds().length} chats? This action
        cannot be undone. All chat data including messages, branches, and
        content will be permanently deleted.
      </DialogDescription>
      <DialogActions>
        <DialogCloseButton>Cancel</DialogCloseButton>
        <DialogActionButton onClick={handleDelete}>Delete</DialogActionButton>
      </DialogActions>
    </>
  );
}
