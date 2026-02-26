import { BrowserWindow, Menu } from "electron";
import {
  IPC_CHANNELS,
  type ChatInfo,
  type ChatTabStateItem,
  type ChatTabsUiState,
  type ChatTreeChildrenSlice,
  type ChatTreeSnapshot,
  type ChatTreeUiState,
  type FolderInfo,
} from "../../../shared/ipc";
import { parseChatId } from "../../../shared/chat/chat-id";
import type { MynthUiMessage } from "../../../shared/chat/message-metadata";
import { parseChatTitle } from "../../../shared/chat/chat-title";
import { parseFolderId } from "../../../shared/folder/folder-id";
import { parseFolderName } from "../../../shared/folder/folder-name";
import { parseWorkspaceId } from "../../../shared/workspace/workspace-id";
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

function parseValidFolderId(input: unknown): string {
  const parsed = parseFolderId(input);
  if (!parsed.ok) {
    throw AppError.badRequest(parsed.error);
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
    throw AppError.badRequest(parsed.error);
  }

  return parsed.value;
}

function parseOptionalBranchId(input: unknown): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input !== "string") {
    throw AppError.badRequest("branchId must be a string.");
  }

  return input;
}

function parseValidFolderName(input: unknown): string {
  const parsed = parseFolderName(input);
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

function parseStringArray(input: unknown, label: string): string[] {
  if (!Array.isArray(input)) {
    throw AppError.badRequest(`${label} must be an array.`);
  }

  const values: string[] = [];
  for (const entry of input) {
    if (typeof entry !== "string") {
      throw AppError.badRequest(`${label} must contain only strings.`);
    }

    values.push(entry);
  }

  return values;
}

function parseChatTabsArray(input: unknown): ChatTabStateItem[] {
  if (!Array.isArray(input)) {
    throw AppError.badRequest("Tabs must be an array.");
  }

  return input.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw AppError.badRequest(`Tab at index ${index} must be an object.`);
    }

    const record = entry as Record<string, unknown>;
    const allowedKeys = new Set(["chatId"]);
    for (const key of Object.keys(record)) {
      if (!allowedKeys.has(key)) {
        throw AppError.badRequest(`Unsupported tab field "${key}".`);
      }
    }

    return {
      chatId: parseValidChatId(record.chatId),
    };
  });
}

export function registerChatTreeIpcModule(
  context: IpcHandlerContext,
  registeredChannels: Set<string>,
): void {
  registerInvokeHandler<[string], ChatTreeSnapshot>(context, registeredChannels, {
    channel: IPC_CHANNELS.chatTree.get,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidWorkspaceId(args[0])];
    },
    handler: ({ services }, _event, workspaceId) => services.chatTree.getChatTree(workspaceId),
  });

  registerInvokeHandler<[string, string | null], ChatTreeChildrenSlice>(
    context,
    registeredChannels,
    {
      channel: IPC_CHANNELS.chatTree.getChildren,
      parseArgs: (args) => {
        expectArgCount(args, 1, 2);
        return [parseValidWorkspaceId(args[0]), parseNullableFolderId(args[1])];
      },
      handler: ({ services }, _event, workspaceId, parentFolderId) =>
        services.chatTree.getChatTreeChildren(workspaceId, parentFolderId),
    },
  );

  registerInvokeHandler<[string], ChatTreeUiState>(context, registeredChannels, {
    channel: IPC_CHANNELS.chatTree.getUiState,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidWorkspaceId(args[0])];
    },
    handler: ({ services }, _event, workspaceId) =>
      services.chatTree.getChatTreeUiState(workspaceId),
  });

  registerInvokeHandler<[string, string[]], ChatTreeUiState>(context, registeredChannels, {
    channel: IPC_CHANNELS.chatTree.setUiState,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      return [parseValidWorkspaceId(args[0]), parseStringArray(args[1], "Expanded folder IDs")];
    },
    handler: ({ services }, _event, workspaceId, expandedFolderIds) =>
      services.chatTree.setChatTreeUiState(workspaceId, expandedFolderIds),
  });

  registerInvokeHandler<[string], ChatTabsUiState>(context, registeredChannels, {
    channel: IPC_CHANNELS.chatTree.getTabsUiState,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidWorkspaceId(args[0])];
    },
    handler: ({ services }, _event, workspaceId) =>
      services.chatTree.getChatTabsUiState(workspaceId),
  });

  registerInvokeHandler<[string, ChatTabStateItem[]], ChatTabsUiState>(
    context,
    registeredChannels,
    {
      channel: IPC_CHANNELS.chatTree.setTabsUiState,
      parseArgs: (args) => {
        expectArgCount(args, 2);
        return [parseValidWorkspaceId(args[0]), parseChatTabsArray(args[1])];
      },
      handler: ({ services }, _event, workspaceId, tabs) =>
        services.chatTree.setChatTabsUiState(workspaceId, tabs),
    },
  );

  registerInvokeHandler<[string, string, string | null], FolderInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.folders.create,
    parseArgs: (args) => {
      expectArgCount(args, 2, 3);
      return [
        parseValidWorkspaceId(args[0]),
        parseValidFolderName(args[1]),
        parseNullableFolderId(args[2]),
      ];
    },
    handler: ({ services }, _event, workspaceId, name, parentId) =>
      services.chatTree.createFolder({ workspaceId, name, parentId }),
  });

  registerInvokeHandler<[string, string], FolderInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.folders.updateName,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      return [parseValidFolderId(args[0]), parseValidFolderName(args[1])];
    },
    handler: ({ services }, _event, id, name) => services.chatTree.updateFolderName(id, name),
  });

  registerInvokeHandler<[string, string | null], FolderInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.folders.move,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      return [parseValidFolderId(args[0]), parseNullableFolderId(args[1])];
    },
    handler: ({ services }, _event, id, parentId) => services.chatTree.moveFolder(id, parentId),
  });

  registerInvokeHandler<[string], void>(context, registeredChannels, {
    channel: IPC_CHANNELS.folders.delete,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidFolderId(args[0])];
    },
    handler: ({ services }, _event, id) => services.chatTree.deleteFolder(id),
  });

  registerInvokeHandler<[string], ChatInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.get,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidChatId(args[0])];
    },
    handler: ({ services }, _event, id) => services.chatTree.getChat(id),
  });

  registerInvokeHandler<[string, string | null], MynthUiMessage[]>(context, registeredChannels, {
    channel: IPC_CHANNELS.chats.listMessages,
    parseArgs: (args) => {
      expectArgCount(args, 1, 2);
      return [parseValidChatId(args[0]), parseOptionalBranchId(args[1])];
    },
    handler: ({ services }, _event, chatId, branchId) =>
      services.chatTree.listChatMessages(chatId, branchId),
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

  registerInvokeHandler<[string, string], "add-folder" | "add-chat" | "rename" | "delete" | null>(
    context,
    registeredChannels,
    {
      channel: IPC_CHANNELS.chatTree.showContextMenu,
      parseArgs: (args) => {
        expectArgCount(args, 2);
        if (typeof args[0] !== "string") throw AppError.badRequest("itemId must be a string.");
        if (args[1] !== "folder" && args[1] !== "chat")
          throw AppError.badRequest("itemKind must be 'folder' or 'chat'.");
        return [args[0], args[1]];
      },
      handler: (_context, event, _itemId, itemKind) => {
        return new Promise<"add-folder" | "add-chat" | "rename" | "delete" | null>((resolve) => {
          let selected: "add-folder" | "add-chat" | "rename" | "delete" | null = null;

          const menu = Menu.buildFromTemplate([
            ...(itemKind === "folder"
              ? ([
                  {
                    label: "Add Folder",
                    click: () => {
                      selected = "add-folder";
                    },
                  },
                  {
                    label: "Add Chat",
                    click: () => {
                      selected = "add-chat";
                    },
                  },
                  { type: "separator" as const },
                ] as const)
              : []),
            {
              label: "Rename",
              click: () => {
                selected = "rename";
              },
            },
            { type: "separator" },
            {
              label: "Delete",
              click: () => {
                selected = "delete";
              },
            },
          ]);

          const win = BrowserWindow.fromWebContents(event.sender) ?? undefined;
          menu.popup({
            window: win,
            callback: () => resolve(selected),
          });
        });
      },
    },
  );
}
