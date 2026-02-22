export const IPC_CHANNELS = {
  workspaces: {
    list: "workspaces:list",
    getActive: "workspaces:getActive",
    create: "workspaces:create",
    setActive: "workspaces:setActive",
    updateName: "workspaces:updateName",
  },
  chatTree: {
    get: "chatTree:get",
  },
  folders: {
    create: "folders:create",
    updateName: "folders:updateName",
    move: "folders:move",
    delete: "folders:delete",
  },
  chats: {
    create: "chats:create",
    updateTitle: "chats:updateTitle",
    move: "chats:move",
    delete: "chats:delete",
  },
} as const;

export interface WorkspaceInfo {
  id: string;
  name: string;
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

export interface IpcApi {
  listWorkspaces: () => Promise<WorkspaceInfo[]>;
  getActiveWorkspace: () => Promise<WorkspaceInfo>;
  createWorkspace: (name: string) => Promise<WorkspaceInfo>;
  setActiveWorkspace: (id: string) => Promise<WorkspaceInfo>;
  updateWorkspaceName: (id: string, name: string) => Promise<WorkspaceInfo>;
  getChatTree: (workspaceId: string) => Promise<ChatTreeSnapshot>;
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
}
