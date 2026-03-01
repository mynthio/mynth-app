import { useMutation, useQueryClient } from "@tanstack/react-query";

import { chatTreeApi } from "../api/chat-tree";
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
        return chatTreeApi.renameFolder(itemId.slice("folder:".length), name);
      }
      return chatTreeApi.renameChat(itemId.slice("chat:".length), name);
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
    mutationFn: (id: string) => chatTreeApi.deleteFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chatTree"] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatTreeApi.deleteChat(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chatTree"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}

export function useMoveFolder() {
  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      chatTreeApi.moveFolder(id, parentId),
  });
}

export function useMoveChat() {
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      chatTreeApi.moveChat(id, folderId),
  });
}
