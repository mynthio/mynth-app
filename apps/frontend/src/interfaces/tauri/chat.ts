export interface TauriChatFolder {
  type: "folder";
  id: string;
  name: string;
  parentId: string | null;
}

export interface TauriChatListItem {
  type: "chat";
  id: string;
  name: string;
  parentId: string | null;
}

export type TauriFlatItem = TauriChatListItem | TauriChatFolder;
