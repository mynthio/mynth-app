import { asc, eq, inArray } from "drizzle-orm";

import { getAppDatabase } from "../db/database";
import { createUuidV7 } from "../db/uuidv7";
import { chats, folders } from "../db/schema";
import { getWorkspaceById } from "../workspaces/repository";

type FolderTableRow = typeof folders.$inferSelect;
type ChatTableRow = typeof chats.$inferSelect;

export interface FolderRow {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatRow {
  id: string;
  workspaceId: string;
  folderId: string | null;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatTreeFolderNode {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
  folders: ChatTreeFolderNode[];
  chats: ChatRow[];
}

export interface ChatTreeSnapshot {
  workspaceId: string;
  rootFolders: ChatTreeFolderNode[];
  rootChats: ChatRow[];
}

function toFolderRow(row: FolderTableRow): FolderRow {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    parentId: row.parentId,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toChatRow(row: ChatTableRow): ChatRow {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    folderId: row.folderId,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireWorkspaceExists(workspaceId: string): void {
  if (!getWorkspaceById(workspaceId)) {
    throw new Error(`Workspace "${workspaceId}" does not exist.`);
  }
}

function getFolderById(id: string): FolderRow | null {
  const row = getAppDatabase().select().from(folders).where(eq(folders.id, id)).get();
  return row ? toFolderRow(row) : null;
}

function requireFolderById(id: string): FolderRow {
  const folder = getFolderById(id);
  if (!folder) {
    throw new Error(`Folder "${id}" does not exist.`);
  }

  return folder;
}

function getChatById(id: string): ChatRow | null {
  const row = getAppDatabase().select().from(chats).where(eq(chats.id, id)).get();
  return row ? toChatRow(row) : null;
}

function requireChatById(id: string): ChatRow {
  const chat = getChatById(id);
  if (!chat) {
    throw new Error(`Chat "${id}" does not exist.`);
  }

  return chat;
}

function wouldFolderParentCreateCycle(
  folderId: string,
  parentId: string,
  foldersById: ReadonlyMap<string, Pick<FolderTableRow, "id" | "parentId">>,
): boolean {
  let currentId: string | null = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === folderId) {
      return true;
    }

    if (visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    const currentFolder = foldersById.get(currentId);
    if (!currentFolder) {
      return false;
    }

    currentId = currentFolder.parentId;
  }

  return false;
}

function collectFolderSubtreeIds(
  allWorkspaceFolders: readonly FolderTableRow[],
  rootFolderId: string,
): string[] {
  const childFolderIdsByParentId = new Map<string, string[]>();

  for (const folder of allWorkspaceFolders) {
    if (!folder.parentId) {
      continue;
    }

    const existing = childFolderIdsByParentId.get(folder.parentId);
    if (existing) {
      existing.push(folder.id);
    } else {
      childFolderIdsByParentId.set(folder.parentId, [folder.id]);
    }
  }

  const subtreeFolderIds: string[] = [];
  const stack = [rootFolderId];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const currentFolderId = stack.pop();
    if (!currentFolderId || seen.has(currentFolderId)) {
      continue;
    }

    seen.add(currentFolderId);
    subtreeFolderIds.push(currentFolderId);

    const children = childFolderIdsByParentId.get(currentFolderId);
    if (!children) {
      continue;
    }

    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push(children[index]);
    }
  }

  return subtreeFolderIds;
}

function warnInvalidFolderParent(
  workspaceId: string,
  folderId: string,
  parentId: string,
  reason: string,
): void {
  console.warn(
    `[chat-tree] Folder "${folderId}" has invalid parent "${parentId}" in workspace "${workspaceId}" (${reason}); treating as root.`,
  );
}

function warnInvalidChatFolder(
  workspaceId: string,
  chatId: string,
  folderId: string,
  reason: string,
): void {
  console.warn(
    `[chat-tree] Chat "${chatId}" has invalid folder "${folderId}" in workspace "${workspaceId}" (${reason}); treating as root.`,
  );
}

export function getChatTree(workspaceId: string): ChatTreeSnapshot {
  requireWorkspaceExists(workspaceId);

  const folderRows = getAppDatabase()
    .select()
    .from(folders)
    .where(eq(folders.workspaceId, workspaceId))
    .orderBy(asc(folders.id))
    .all();

  const chatRows = getAppDatabase()
    .select()
    .from(chats)
    .where(eq(chats.workspaceId, workspaceId))
    .orderBy(asc(chats.id))
    .all();

  const folderRowsById = new Map(folderRows.map((row) => [row.id, row] as const));
  const folderNodesById = new Map<string, ChatTreeFolderNode>();

  for (const row of folderRows) {
    folderNodesById.set(row.id, {
      ...toFolderRow(row),
      folders: [],
      chats: [],
    });
  }

  const rootFolders: ChatTreeFolderNode[] = [];

  for (const row of folderRows) {
    const node = folderNodesById.get(row.id);
    if (!node) {
      continue;
    }

    if (!row.parentId) {
      rootFolders.push(node);
      continue;
    }

    if (row.parentId === row.id) {
      warnInvalidFolderParent(workspaceId, row.id, row.parentId, "self-parent");
      rootFolders.push(node);
      continue;
    }

    const parentRow = folderRowsById.get(row.parentId);
    if (!parentRow) {
      warnInvalidFolderParent(workspaceId, row.id, row.parentId, "missing parent");
      rootFolders.push(node);
      continue;
    }

    if (wouldFolderParentCreateCycle(row.id, row.parentId, folderRowsById)) {
      warnInvalidFolderParent(workspaceId, row.id, row.parentId, "cycle");
      rootFolders.push(node);
      continue;
    }

    const parentNode = folderNodesById.get(row.parentId);
    if (!parentNode) {
      warnInvalidFolderParent(workspaceId, row.id, row.parentId, "missing parent node");
      rootFolders.push(node);
      continue;
    }

    parentNode.folders.push(node);
  }

  const rootChats: ChatRow[] = [];

  for (const row of chatRows) {
    const chat = toChatRow(row);

    if (!row.folderId) {
      rootChats.push(chat);
      continue;
    }

    const folderNode = folderNodesById.get(row.folderId);
    if (!folderNode) {
      warnInvalidChatFolder(workspaceId, row.id, row.folderId, "missing folder");
      rootChats.push(chat);
      continue;
    }

    folderNode.chats.push(chat);
  }

  return {
    workspaceId,
    rootFolders,
    rootChats,
  };
}

export function createFolder(input: {
  workspaceId: string;
  name: string;
  parentId: string | null;
}): FolderRow {
  requireWorkspaceExists(input.workspaceId);

  if (input.parentId !== null) {
    const parentFolder = requireFolderById(input.parentId);
    if (parentFolder.workspaceId !== input.workspaceId) {
      throw new Error(`Parent folder "${input.parentId}" belongs to a different workspace.`);
    }
  }

  const id = createUuidV7();

  getAppDatabase()
    .insert(folders)
    .values({
      id,
      workspaceId: input.workspaceId,
      parentId: input.parentId,
      name: input.name,
    })
    .run();

  return requireFolderById(id);
}

export function updateFolderName(id: string, name: string): FolderRow {
  getAppDatabase()
    .update(folders)
    .set({
      name,
      updatedAt: Date.now(),
    })
    .where(eq(folders.id, id))
    .run();

  return requireFolderById(id);
}

export function moveFolder(id: string, parentId: string | null): FolderRow {
  return getAppDatabase().transaction((tx) => {
    const folder = tx.select().from(folders).where(eq(folders.id, id)).get();
    if (!folder) {
      throw new Error(`Folder "${id}" does not exist.`);
    }

    if (parentId === folder.id) {
      throw new Error(`Folder "${id}" cannot be moved into itself.`);
    }

    if (parentId !== null) {
      const parentFolder = tx.select().from(folders).where(eq(folders.id, parentId)).get();
      if (!parentFolder) {
        throw new Error(`Parent folder "${parentId}" does not exist.`);
      }

      if (parentFolder.workspaceId !== folder.workspaceId) {
        throw new Error(`Parent folder "${parentId}" belongs to a different workspace.`);
      }

      const workspaceFolders = tx
        .select()
        .from(folders)
        .where(eq(folders.workspaceId, folder.workspaceId))
        .all();
      const workspaceFoldersById = new Map(workspaceFolders.map((row) => [row.id, row] as const));

      if (wouldFolderParentCreateCycle(folder.id, parentId, workspaceFoldersById)) {
        throw new Error(`Folder "${id}" cannot be moved into descendant folder "${parentId}".`);
      }
    }

    tx.update(folders)
      .set({
        parentId,
        updatedAt: Date.now(),
      })
      .where(eq(folders.id, id))
      .run();

    const updatedFolder = tx.select().from(folders).where(eq(folders.id, id)).get();
    if (!updatedFolder) {
      throw new Error(`Folder "${id}" does not exist.`);
    }

    return toFolderRow(updatedFolder);
  });
}

export function deleteFolderRecursive(id: string): void {
  getAppDatabase().transaction((tx) => {
    const folder = tx.select().from(folders).where(eq(folders.id, id)).get();
    if (!folder) {
      throw new Error(`Folder "${id}" does not exist.`);
    }

    const workspaceFolders = tx
      .select()
      .from(folders)
      .where(eq(folders.workspaceId, folder.workspaceId))
      .all();
    const subtreeFolderIds = collectFolderSubtreeIds(workspaceFolders, id);

    if (subtreeFolderIds.length === 0) {
      return;
    }

    tx.delete(chats).where(inArray(chats.folderId, subtreeFolderIds)).run();
    tx.delete(folders).where(inArray(folders.id, subtreeFolderIds)).run();
  });
}

export function createChat(input: {
  workspaceId: string;
  title: string;
  folderId: string | null;
}): ChatRow {
  requireWorkspaceExists(input.workspaceId);

  if (input.folderId !== null) {
    const folder = requireFolderById(input.folderId);
    if (folder.workspaceId !== input.workspaceId) {
      throw new Error(`Folder "${input.folderId}" belongs to a different workspace.`);
    }
  }

  const id = createUuidV7();

  getAppDatabase()
    .insert(chats)
    .values({
      id,
      workspaceId: input.workspaceId,
      folderId: input.folderId,
      title: input.title,
    })
    .run();

  return requireChatById(id);
}

export function updateChatTitle(id: string, title: string): ChatRow {
  getAppDatabase()
    .update(chats)
    .set({
      title,
      updatedAt: Date.now(),
    })
    .where(eq(chats.id, id))
    .run();

  return requireChatById(id);
}

export function moveChat(id: string, folderId: string | null): ChatRow {
  return getAppDatabase().transaction((tx) => {
    const chat = tx.select().from(chats).where(eq(chats.id, id)).get();
    if (!chat) {
      throw new Error(`Chat "${id}" does not exist.`);
    }

    if (folderId !== null) {
      const folder = tx.select().from(folders).where(eq(folders.id, folderId)).get();
      if (!folder) {
        throw new Error(`Folder "${folderId}" does not exist.`);
      }

      if (folder.workspaceId !== chat.workspaceId) {
        throw new Error(`Folder "${folderId}" belongs to a different workspace.`);
      }
    }

    tx.update(chats)
      .set({
        folderId,
        updatedAt: Date.now(),
      })
      .where(eq(chats.id, id))
      .run();

    const updatedChat = tx.select().from(chats).where(eq(chats.id, id)).get();
    if (!updatedChat) {
      throw new Error(`Chat "${id}" does not exist.`);
    }

    return toChatRow(updatedChat);
  });
}

export function deleteChat(id: string): void {
  requireChatById(id);
  getAppDatabase().delete(chats).where(eq(chats.id, id)).run();
}
