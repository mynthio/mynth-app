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
import { useChat } from "../../../data/queries/chats/use-chat";
import { closeActionDialog } from "..";
import { invoke } from "@tauri-apps/api/core";
import { GET_CHAT_KEYS, GET_CHATS_KEYS } from "../../../data/utils/query-keys";
import { navigationStore } from "../../../stores/navigation.store";

export type DELETE_CHAT_EVENT_ID = "delete-chat";

export interface DeleteChatDialogProps {
  chatId: string;
}

export function DeleteChatDialog(props: DeleteChatDialogProps) {
  const dialog = useDialog();
  const queryClient = useQueryClient();

  const chatId = createMemo(() => props.chatId);

  const chat = useChat({
    chatId,
  });

  const handleDelete = async () => {
    try {
      await invoke("delete_chat", { chatId: chatId() });

      // Invalidate chats queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: GET_CHAT_KEYS({ chatId }),
      });

      // Invalidate chats queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: GET_CHATS_KEYS({
          workspaceId: () => navigationStore.workspace.id,
        }),
      });

      dialog.setOpen(false);
    } catch (error) {
      console.error("Failed to delete chat:", error);
      // Here you might want to show an error notification to the user
    }
  };

  return (
    <>
      <DialogLabel>
        Delete <i>{chat.data?.name}</i>?
      </DialogLabel>
      <DialogDescription>
        Are you sure you want to delete <i>{chat.data?.name}</i>? This action
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
