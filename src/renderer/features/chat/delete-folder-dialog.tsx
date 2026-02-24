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
import { useDeleteFolder } from "@/mutations/chat-tree";

interface DeleteFolderDialogProps {
  folderId: string | undefined;
  onSuccess?: () => void;
}

export function DeleteFolderDialog({ folderId, onSuccess }: DeleteFolderDialogProps) {
  const navigate = useNavigate();
  const deleteFolder = useDeleteFolder();

  const close = () => {
    void navigate({ to: "/chat", search: {} });
  };

  const handleConfirm = () => {
    if (!folderId) return;
    deleteFolder.mutate(folderId, {
      onSuccess,
      onSettled: close,
    });
  };

  return (
    <AlertDialog open={Boolean(folderId)} onOpenChange={(open) => !open && close()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this folder and all its contents (subfolders and chats).
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="secondary" />}>Cancel</AlertDialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteFolder.isPending}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
