import type { TabStateItem } from "../../shared/ipc";
import "../lib/electron-api";
import { parseWorkspaceId } from "../../shared/workspace/workspace-id";

export const chatTreeApi = {
  getChildren(workspaceId: string, parentFolderId: string | null) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.getChatTreeChildren(parsedWorkspaceId.value, parentFolderId);
  },

  getUiState(workspaceId: string) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.getChatTreeUiState(parsedWorkspaceId.value);
  },

  setUiState(workspaceId: string, expandedFolderIds: string[]) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.setChatTreeUiState(parsedWorkspaceId.value, expandedFolderIds);
  },

  getTabsUiState(workspaceId: string) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.getTabsUiState(parsedWorkspaceId.value);
  },

  setTabsUiState(workspaceId: string, tabs: TabStateItem[]) {
    const parsedWorkspaceId = parseWorkspaceId(workspaceId);
    if (!parsedWorkspaceId.ok) {
      throw new Error(parsedWorkspaceId.error);
    }

    return window.electronAPI.setTabsUiState(parsedWorkspaceId.value, tabs);
  },

  renameFolder(id: string, name: string) {
    return window.electronAPI.updateFolderName(id, name);
  },

  renameChat(id: string, title: string) {
    return window.electronAPI.updateChatTitle(id, title);
  },

  deleteFolder(id: string) {
    return window.electronAPI.deleteFolder(id);
  },

  deleteChat(id: string) {
    return window.electronAPI.deleteChat(id);
  },

  moveFolder(id: string, parentId: string | null) {
    return window.electronAPI.moveFolder(id, parentId);
  },

  moveChat(id: string, folderId: string | null) {
    return window.electronAPI.moveChat(id, folderId);
  },

  showContextMenu(itemId: string, itemKind: "folder" | "chat") {
    return window.electronAPI.showChatTreeItemContextMenu(itemId, itemKind);
  },
};
