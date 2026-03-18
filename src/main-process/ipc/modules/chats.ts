import { IPC_CHANNELS, type ChatInfo } from "@shared/ipc";
import { parseChatId } from "@shared/chat/chat-id";
import { parseChatTitle } from "@shared/chat/chat-title";
import { parseFolderId } from "@shared/folder/folder-id";
import { parseWorkspaceId } from "@shared/workspace/workspace-id";
import type { IpcHandlerContext } from "../core/context";
import { AppError } from "../core/errors";
import { registerInvokeHandler } from "../core/register-invoke-handler";

function expectArgCount(args: unknown[], min: number, max = min): void {
  if (args.length < min || args.length > max) {
    throw AppError.badRequest(
      `Invalid IPC argument count. Expected ${min === max ? `${min}` : `${min}-${max}`}, received ${args.length}.`,
    );
  }
}

function parseValidWorkspaceId(input: unknown): string {
  const parsed = parseWorkspaceId(input);
  if (!parsed.ok) {
    throw AppError.badRequest(parsed.error);
  }

  return parsed.value;
}

function parseValidChatId(input: unknown): string {
  const parsed = parseChatId(input);
  if (!parsed.ok) {
    throw AppError.badRequest(parsed.error);
  }

  return parsed.value;
}

function parseNullableFolderId(input: unknown): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  const parsed = parseFolderId(input);
  if (!parsed.ok) {
    throw AppError.badRequest(parsed.error);
  }

  return parsed.value;
}

function parseValidChatTitle(input: unknown): string {
  const parsed = parseChatTitle(input);
  if (!parsed.ok) {
    throw AppError.badRequest(parsed.error);
  }

  return parsed.value;
}

export function registerChatsIpcModule(
  context: IpcHandlerContext,
  registeredChannels: Set<string>,
): void {
  registerInvokeHandler<[string], ChatInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.get,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidChatId(args[0])];
    },
    handler: ({ services }, _event, id) => services.chatTree.getChat(id),
  });

  registerInvokeHandler<[string, string, string | null], ChatInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.create,
    parseArgs: (args) => {
      expectArgCount(args, 2, 3);
      return [
        parseValidWorkspaceId(args[0]),
        parseValidChatTitle(args[1]),
        parseNullableFolderId(args[2]),
      ];
    },
    handler: ({ services }, _event, workspaceId, title, folderId) =>
      services.chatTree.createChat({ workspaceId, title, folderId }),
  });

  registerInvokeHandler<[string, string], ChatInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.updateTitle,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      return [parseValidChatId(args[0]), parseValidChatTitle(args[1])];
    },
    handler: ({ services }, _event, id, title) => services.chatTree.updateChatTitle(id, title),
  });

  registerInvokeHandler<[string, string | null], ChatInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.move,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      return [parseValidChatId(args[0]), parseNullableFolderId(args[1])];
    },
    handler: ({ services }, _event, id, folderId) => services.chatTree.moveChat(id, folderId),
  });

  registerInvokeHandler<[string], void>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.delete,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidChatId(args[0])];
    },
    handler: ({ services }, _event, id) => services.chatTree.deleteChat(id),
  });
}
