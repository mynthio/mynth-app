import { useMutation } from "@tanstack/react-query";

import { chatsApi } from "../api/chats";

export function useCreateChat() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      title,
      folderId,
    }: {
      workspaceId: string;
      title: string;
      folderId?: string | null;
    }) => chatsApi.create(workspaceId, title, folderId),
  });
}

export function useUpdateChatTitle() {
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => chatsApi.updateTitle(id, title),
  });
}

export function useMoveChat() {
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      chatsApi.move(id, folderId),
  });
}

export function useDeleteChat() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => chatsApi.delete(id),
  });
}
