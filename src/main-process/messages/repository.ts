import { asc, eq } from "drizzle-orm";

import { getAppDatabase } from "../db/database";
import { messages } from "../db/schema";

export type MessageTableRow = typeof messages.$inferSelect;
export type MessageRole = "system" | "user" | "assistant";

export interface MessageRow {
  id: string;
  chatId: string;
  parentId: string | null;
  role: MessageRole;
  parts: unknown[];
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface UpsertMessageInput {
  id: string;
  chatId: string;
  parentId: string | null;
  role: MessageRole;
  parts: unknown[];
  metadata: Record<string, unknown>;
}

/**
 * Returns the linear message history for a chat by tracing from a leaf back to the root.
 *
 * When `branchId` is provided, the leaf is the latest leaf reachable from that branch node.
 * When `branchId` is null/undefined, the leaf is the most recently created leaf across all branches.
 *
 * Messages are returned in conversation order: root first, leaf last.
 */
export function listMessagesByChatId(chatId: string, branchId?: string | null): MessageRow[] {
  const db = getAppDatabase();

  // Load all messages for the chat, oldest first so iteration order is predictable.
  const allMessages = db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .all();

  if (allMessages.length === 0) {
    return [];
  }

  // Build lookup structures once.
  const messageMap = new Map<string, MessageTableRow>();
  // Maps parentId → list of direct children (preserves insertion/creation order).
  const childrenByParentId = new Map<string | null, MessageTableRow[]>();

  for (const msg of allMessages) {
    messageMap.set(msg.id, msg);

    const parentKey = msg.parentId;
    let siblings = childrenByParentId.get(parentKey);
    if (!siblings) {
      siblings = [];
      childrenByParentId.set(parentKey, siblings);
    }
    siblings.push(msg);
  }

  // Find the leaf from which we will trace back to the root.
  let leafMessage: MessageTableRow | undefined;

  if (branchId != null) {
    const branchMessage = messageMap.get(branchId);
    if (!branchMessage) {
      throw new Error(`Branch message "${branchId}" does not exist in chat "${chatId}".`);
    }
    leafMessage = findLatestLeafInSubtree(branchId, allMessages, childrenByParentId);
  } else {
    leafMessage = findLatestLeaf(allMessages, childrenByParentId);
  }

  if (!leafMessage) {
    return [];
  }

  // Trace path from leaf back to root.
  const path: MessageTableRow[] = [];
  let current: MessageTableRow | undefined = leafMessage;
  const visited = new Set<string>(); // guard against corrupt parent cycles

  while (current !== undefined && !visited.has(current.id)) {
    visited.add(current.id);
    path.push(current);
    current = current.parentId != null ? messageMap.get(current.parentId) : undefined;
  }

  // Reverse so the path runs root → leaf.
  path.reverse();

  return path.map(toMessageRow);
}

export function upsertMessage(input: UpsertMessageInput): MessageRow {
  const db = getAppDatabase();
  const existing = db.select().from(messages).where(eq(messages.id, input.id)).get();
  const serializedParts = JSON.stringify(input.parts);
  const serializedMetadata = JSON.stringify(input.metadata);

  if (!existing) {
    db.insert(messages)
      .values({
        id: input.id,
        chatId: input.chatId,
        parentId: input.parentId,
        role: input.role,
        parts: serializedParts,
        metadata: serializedMetadata,
      })
      .run();
  } else {
    db.update(messages)
      .set({
        chatId: input.chatId,
        parentId: input.parentId,
        role: input.role,
        parts: serializedParts,
        metadata: serializedMetadata,
        updatedAt: Date.now(),
      })
      .where(eq(messages.id, input.id))
      .run();
  }

  const saved = db.select().from(messages).where(eq(messages.id, input.id)).get();
  if (!saved) {
    throw new Error(`Message "${input.id}" could not be saved.`);
  }

  return toMessageRow(saved);
}

/**
 * Returns the most recently created leaf message (a message with no children)
 * across all branches of the chat.
 *
 * `allMessages` must be sorted ascending by createdAt so iterating in reverse
 * yields the latest message first.
 */
function findLatestLeaf(
  allMessages: MessageTableRow[],
  childrenByParentId: Map<string | null, MessageTableRow[]>,
): MessageTableRow | undefined {
  // Iterate newest → oldest; return the first message that has no children.
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i]!;
    const children = childrenByParentId.get(msg.id);
    if (!children || children.length === 0) {
      return msg;
    }
  }
  return undefined;
}

/**
 * Returns the most recently created leaf reachable from `rootId` (inclusive).
 *
 * Performs a depth-first traversal of the subtree rooted at `rootId`, then
 * picks the latest leaf by createdAt among all discovered leaf nodes.
 */
function findLatestLeafInSubtree(
  rootId: string,
  allMessages: MessageTableRow[],
  childrenByParentId: Map<string | null, MessageTableRow[]>,
): MessageTableRow | undefined {
  // Collect all descendant IDs (including rootId itself).
  const descendants = new Set<string>();
  const stack: string[] = [rootId];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (descendants.has(id)) {
      continue;
    }
    descendants.add(id);
    const children = childrenByParentId.get(id);
    if (children) {
      for (const child of children) {
        stack.push(child.id);
      }
    }
  }

  // allMessages is sorted asc; iterate in reverse for latest-first.
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i]!;
    if (!descendants.has(msg.id)) {
      continue;
    }
    const children = childrenByParentId.get(msg.id);
    if (!children || children.length === 0) {
      return msg;
    }
  }

  return undefined;
}

function toMessageRow(row: MessageTableRow): MessageRow {
  return {
    id: row.id,
    chatId: row.chatId,
    parentId: row.parentId,
    role: parseMessageRole(row.role),
    parts: parseJsonArray(row.parts),
    metadata: parseJsonObject(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseMessageRole(value: string): MessageRole {
  if (value === "system" || value === "user" || value === "assistant") {
    return value;
  }

  throw new Error(`Unsupported message role "${value}".`);
}

function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}
