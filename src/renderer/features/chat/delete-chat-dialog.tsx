import { useNavigate } from "@tanstack/react-router";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteChat } from "@/mutations/chat-tree";

interface DeleteChatDialogProps {
  chatId: string | undefined;
  onSuccess?: () => void;
}

export function DeleteChatDialog({ chatId, onSuccess }: DeleteChatDialogProps) {
  const navigate = useNavigate();
  const deleteChat = useDeleteChat();

  const close = () => {
    void navigate({ to: "/chat", search: {} });
  };

  const handleConfirm = () => {
    if (!chatId) return;
    deleteChat.mutate(chatId, {
      onSuccess,
      onSettled: close,
    });
  };

  return (
    <AlertDialog open={Boolean(chatId)} onOpenChange={(open) => !open && close()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Chat</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this chat. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="secondary" />}>Cancel</AlertDialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteChat.isPending}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
