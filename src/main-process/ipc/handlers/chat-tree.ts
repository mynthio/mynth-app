import {
  createChat,
  createFolder,
  deleteChat,
  deleteFolderRecursive,
  getChatTree,
  moveChat,
  moveFolder,
  updateChatTitle,
  updateFolderName,
} from "../chat-tree/repository";
import { IPC_CHANNELS } from "../../shared/ipc";
import { parseChatId } from "../../shared/chat-id";
import { parseChatTitle } from "../../shared/chat-title";
import { parseFolderId } from "../../shared/folder-id";
import { parseFolderName } from "../../shared/folder-name";
import { parseWorkspaceId } from "../../shared/workspace-id";
import { registerIpcHandler } from "./register-handler";

function parseValidWorkspaceId(input: unknown): string {
  const parsed = parseWorkspaceId(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.value;
}

function parseValidFolderId(input: unknown): string {
  const parsed = parseFolderId(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.value;
}

function parseNullableFolderId(input: unknown): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  return parseValidFolderId(input);
}

function parseValidChatId(input: unknown): string {
  const parsed = parseChatId(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.value;
}

function parseValidFolderName(input: unknown): string {
  const parsed = parseFolderName(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.value;
}

function parseValidChatTitle(input: unknown): string {
  const parsed = parseChatTitle(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.value;
}

export function registerChatTreeHandlers(): void {
  registerIpcHandler(IPC_CHANNELS.chatTree.get, (_event, workspaceId: unknown) => {
    return getChatTree(parseValidWorkspaceId(workspaceId));
  });

  registerIpcHandler(
    IPC_CHANNELS.folders.create,
    (_event, workspaceId: unknown, name: unknown, parentId: unknown) => {
      return createFolder({
        workspaceId: parseValidWorkspaceId(workspaceId),
        name: parseValidFolderName(name),
        parentId: parseNullableFolderId(parentId),
      });
    },
  );

  registerIpcHandler(IPC_CHANNELS.folders.updateName, (_event, id: unknown, name: unknown) => {
    return updateFolderName(parseValidFolderId(id), parseValidFolderName(name));
  });

  registerIpcHandler(IPC_CHANNELS.folders.move, (_event, id: unknown, parentId: unknown) => {
    return moveFolder(parseValidFolderId(id), parseNullableFolderId(parentId));
  });

  registerIpcHandler(IPC_CHANNELS.folders.delete, (_event, id: unknown) => {
    deleteFolderRecursive(parseValidFolderId(id));
  });

  registerIpcHandler(
    IPC_CHANNELS.chats.create,
    (_event, workspaceId: unknown, title: unknown, folderId: unknown) => {
      return createChat({
        workspaceId: parseValidWorkspaceId(workspaceId),
        title: parseValidChatTitle(title),
        folderId: parseNullableFolderId(folderId),
      });
    },
  );

  registerIpcHandler(IPC_CHANNELS.chats.updateTitle, (_event, id: unknown, title: unknown) => {
    return updateChatTitle(parseValidChatId(id), parseValidChatTitle(title));
  });

  registerIpcHandler(IPC_CHANNELS.chats.move, (_event, id: unknown, folderId: unknown) => {
    return moveChat(parseValidChatId(id), parseNullableFolderId(folderId));
  });

  registerIpcHandler(IPC_CHANNELS.chats.delete, (_event, id: unknown) => {
    deleteChat(parseValidChatId(id));
  });
}
