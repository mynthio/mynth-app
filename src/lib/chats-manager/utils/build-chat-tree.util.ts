import {
  TauriChatListItem,
  TauriChatFolder,
} from "../../../interfaces/tauri/chat";
import { ChatTreeItemType } from "../enums/chat-tree-item-type.enum";
import { ChatTreeFolder } from "../types/chat-tree-folder.type";
import { ChatTree } from "../types/chat-tree.type";

export function buildChatTree(
  folders: TauriChatFolder[],
  chats: TauriChatListItem[]
): ChatTree {
  // Create a Map for O(1) folder lookups
  const folderMap = new Map<string, ChatTreeFolder>();

  // Initialize all folders with empty children array
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      type: ChatTreeItemType.FOLDER as const,

      id: folder.id,
      name: folder.name,

      children: [], // This will now contain both folders and chats
    });
  });

  // Build folder hierarchy
  const rootFolders: ChatTree = [];
  folders.forEach((folder) => {
    const folderNode = folderMap.get(folder.id)!;

    if (folder.parentId === null) {
      rootFolders.push(folderNode);
    } else {
      const parentFolder = folderMap.get(folder.parentId);
      if (parentFolder) {
        parentFolder.children.push(folderNode);
      }
    }
  });

  // Assign chats to their folders
  chats.forEach((chat) => {
    const chatNode = {
      type: ChatTreeItemType.CHAT as const,

      id: chat.id,
      name: chat.name,
    };

    if (chat.parentId === null) {
      rootFolders.push(chatNode);
    } else {
      const parentFolder = folderMap.get(chat.parentId);
      if (parentFolder) {
        parentFolder.children.push(chatNode);
      }
    }
  });

  return rootFolders;
}
