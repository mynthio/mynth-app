import { useMutation, useQueryClient } from "@tanstack/react-query";

import { chatTreeApi } from "../api/chat-tree";
import { chatsApi } from "../api/chats";
import { foldersApi } from "../api/folders";
import { queryKeys } from "../queries/keys";

export function useSetChatTreeUiState() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      expandedFolderIds,
    }: {
      workspaceId: string;
      expandedFolderIds: string[];
    }) => chatTreeApi.setUiState(workspaceId, expandedFolderIds),
  });
}

export function useRenameChatTreeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, name }: { itemId: string; name: string }) => {
      if (itemId.startsWith("folder:")) {
        return foldersApi.updateName(itemId.slice("folder:".length), name);
      }
      return chatsApi.updateTitle(itemId.slice("chat:".length), name);
    },
    onSuccess: (_result, variables) => {
      if (!variables.itemId.startsWith("chat:")) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foldersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chatTree"] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chatTree"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}

export function useMoveFolder() {
  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      foldersApi.move(id, parentId),
  });
}

export function useMoveChat() {
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      chatsApi.move(id, folderId),
  });
}
