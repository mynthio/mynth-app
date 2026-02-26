import type { ProviderId } from "../providers/catalog";
import type { MynthUiMessage } from "../chat/message-metadata";

export const IPC_CHANNELS = {
  workspaces: {
    list: "workspaces:list",
    getActive: "workspaces:getActive",
    create: "workspaces:create",
    setActive: "workspaces:setActive",
    update: "workspaces:update",
  },
  chatTree: {
    get: "chatTree:get",
    getChildren: "chatTree:getChildren",
    getUiState: "chatTree:getUiState",
    setUiState: "chatTree:setUiState",
    getTabsUiState: "chatTree:getTabsUiState",
    setTabsUiState: "chatTree:setTabsUiState",
    showContextMenu: "chatTree:showContextMenu",
  },
  folders: {
    create: "folders:create",
    updateName: "folders:updateName",
    move: "folders:move",
    delete: "folders:delete",
  },
  chats: {
    get: "chats:get",
    listMessages: "chats:listMessages",
    create: "chats:create",
    updateTitle: "chats:updateTitle",
    move: "chats:move",
    delete: "chats:delete",
  },
  providers: {
    list: "providers:list",
    listModels: "providers:listModels",
    testCredentials: "providers:testCredentials",
    save: "providers:save",
    delete: "providers:delete",
  },
  models: {
    listEnabled: "models:listEnabled",
    update: "models:update",
    setProviderEnabled: "models:setProviderEnabled",
  },
} as const;

export interface WorkspaceInfo {
  id: string;
  name: string;
  color?: string;
}

export interface WorkspaceUpdateInput {
  name?: string;
  color?: string | null;
}

export interface FolderInfo {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatInfo {
  id: string;
  workspaceId: string;
  folderId: string | null;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatTreeFolderNode extends FolderInfo {
  folders: ChatTreeFolderNode[];
  chats: ChatInfo[];
}

export interface ChatTreeSnapshot {
  workspaceId: string;
  rootFolders: ChatTreeFolderNode[];
  rootChats: ChatInfo[];
}

export interface ChatTreeFolderListItem extends FolderInfo {
  childFolderCount: number;
  childChatCount: number;
}

export interface ChatTreeChildrenSlice {
  workspaceId: string;
  parentFolderId: string | null;
  folders: ChatTreeFolderListItem[];
  chats: ChatInfo[];
}

export interface ChatTreeUiState {
  expandedFolderIds: string[];
}

export interface ChatTabStateItem {
  chatId: string;
}

export interface ChatTabsUiState {
  tabs: ChatTabStateItem[];
}

export interface ProviderCredentialTestInput {
  providerId: ProviderId;
  config: Record<string, unknown>;
}

export interface ProviderCredentialTestResult {
  providerId: ProviderId;
  ok: boolean;
  message: string;
}

export interface ProviderInfo {
  id: string;
  displayName: string;
  catalogId: ProviderId;
}

export type ProviderModelStatus = "active" | "deprecated" | "removed";

export interface ProviderModelInfo {
  id: string;
  providerId: string;
  providerModelId: string;
  displayName: string | null;
  isEnabled: boolean;
  status: ProviderModelStatus;
}

export interface SaveProviderInput {
  catalogId: ProviderId;
  displayName?: string;
  config: Record<string, unknown>;
}

export interface SaveProviderResult {
  id: string;
  displayName: string;
  catalogId: ProviderId;
}

export interface UpdateModelInput {
  isEnabled?: boolean;
  displayName?: string | null;
}

export interface UpdateModelResult {
  id: string;
  providerId: string;
  providerModelId: string;
  displayName: string | null;
  isEnabled: boolean;
  status: ProviderModelStatus;
}

export interface SetProviderModelsEnabledResult {
  providerId: string;
  isEnabled: boolean;
  matchedCount: number;
  updatedCount: number;
}

export interface IpcApi {
  onSystemEvent: (callback: (event: import("../events").SystemEvent) => void) => () => void;
  getSystemState: () => Promise<import("../events").SystemState>;
  listWorkspaces: () => Promise<WorkspaceInfo[]>;
  getActiveWorkspace: () => Promise<WorkspaceInfo>;
  createWorkspace: (name: string) => Promise<WorkspaceInfo>;
  setActiveWorkspace: (id: string) => Promise<WorkspaceInfo>;
  updateWorkspace: (id: string, input: WorkspaceUpdateInput) => Promise<WorkspaceInfo>;
  getChatTree: (workspaceId: string) => Promise<ChatTreeSnapshot>;
  getChatTreeChildren: (
    workspaceId: string,
    parentFolderId?: string | null,
  ) => Promise<ChatTreeChildrenSlice>;
  getChatTreeUiState: (workspaceId: string) => Promise<ChatTreeUiState>;
  setChatTreeUiState: (
    workspaceId: string,
    expandedFolderIds: string[],
  ) => Promise<ChatTreeUiState>;
  getChatTabsUiState: (workspaceId: string) => Promise<ChatTabsUiState>;
  setChatTabsUiState: (workspaceId: string, tabs: ChatTabStateItem[]) => Promise<ChatTabsUiState>;
  getChat: (id: string) => Promise<ChatInfo>;
  listChatMessages: (chatId: string, branchId?: string | null) => Promise<MynthUiMessage[]>;
  createFolder: (
    workspaceId: string,
    name: string,
    parentId?: string | null,
  ) => Promise<FolderInfo>;
  updateFolderName: (id: string, name: string) => Promise<FolderInfo>;
  moveFolder: (id: string, parentId: string | null) => Promise<FolderInfo>;
  deleteFolder: (id: string) => Promise<void>;
  createChat: (workspaceId: string, title: string, folderId?: string | null) => Promise<ChatInfo>;
  updateChatTitle: (id: string, title: string) => Promise<ChatInfo>;
  moveChat: (id: string, folderId: string | null) => Promise<ChatInfo>;
  deleteChat: (id: string) => Promise<void>;
  showChatTreeItemContextMenu: (
    itemId: string,
    itemKind: "folder" | "chat",
  ) => Promise<"add-folder" | "add-chat" | "rename" | "delete" | null>;
  listProviders: () => Promise<ProviderInfo[]>;
  listProviderModels: (providerId: string) => Promise<ProviderModelInfo[]>;
  testProviderCredentials: (
    input: ProviderCredentialTestInput,
  ) => Promise<ProviderCredentialTestResult>;
  saveProvider: (input: SaveProviderInput) => Promise<SaveProviderResult>;
  deleteProvider: (providerId: string) => Promise<void>;
  listEnabledModels: () => Promise<ProviderModelInfo[]>;
  updateModel: (modelId: string, input: UpdateModelInput) => Promise<UpdateModelResult>;
  setProviderModelsEnabled: (
    providerId: string,
    isEnabled: boolean,
  ) => Promise<SetProviderModelsEnabledResult>;
}
