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
    tabsUiState: (workspaceId: string) =>
      [...queryKeys.chatTree.all, "tabsUiState", workspaceId] as const,
  },
  chats: {
    all: ["chats"] as const,
    byId: (chatId: string) => [...queryKeys.chats.all, "byId", chatId] as const,
    detail: (workspaceId: string, chatId: string) =>
      [...queryKeys.chats.all, "detail", workspaceId, chatId] as const,
  },
  folders: {
    all: ["folders"] as const,
    detail: (workspaceId: string, folderId: string) =>
      [...queryKeys.folders.all, "detail", workspaceId, folderId] as const,
  },
  providers: {
    all: ["providers"] as const,
    list: () => [...queryKeys.providers.all, "list"] as const,
    models: (providerId: string) => [...queryKeys.providers.all, "models", providerId] as const,
    detail: (id: string) => [...queryKeys.providers.all, "detail", id] as const,
  },
} as const;
