export const queryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    list: () => [...queryKeys.workspaces.all, "list"] as const,
    active: () => [...queryKeys.workspaces.all, "active"] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, "detail", id] as const,
  },
  chatTree: {
    all: ["chatTree"] as const,
    uiState: (workspaceId: string) => [...queryKeys.chatTree.all, "uiState", workspaceId] as const,
  },
  chats: {
    all: ["chats"] as const,
    detail: (workspaceId: string, chatId: string) =>
      [...queryKeys.chats.all, "detail", workspaceId, chatId] as const,
  },
  folders: {
    all: ["folders"] as const,
    detail: (workspaceId: string, folderId: string) =>
      [...queryKeys.folders.all, "detail", workspaceId, folderId] as const,
  },
} as const;
