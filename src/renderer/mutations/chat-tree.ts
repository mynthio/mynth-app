import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChatTabsUiState, ChatTabStateItem } from "../../shared/ipc";

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

export function useSetChatTabsUiState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, tabs }: { workspaceId: string; tabs: ChatTabStateItem[] }) =>
      chatTreeApi.setTabsUiState(workspaceId, tabs),
    onMutate: async ({ workspaceId, tabs }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.chatTree.tabsUiState(workspaceId),
        exact: true,
      });

      const queryKey = queryKeys.chatTree.tabsUiState(workspaceId);
      const previousState = queryClient.getQueryData<ChatTabsUiState>(queryKey);

      queryClient.setQueryData<ChatTabsUiState>(queryKey, { tabs });

      return { queryKey, previousState };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(context.queryKey, context.previousState);
        return;
      }

      if (context?.queryKey) {
        queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
      }
    },
    onSuccess: (nextState, { workspaceId }) => {
      queryClient.setQueryData(queryKeys.chatTree.tabsUiState(workspaceId), nextState);
    },
    onSettled: (_data, _error, { workspaceId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chatTree.tabsUiState(workspaceId),
        exact: true,
      });
    },
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
