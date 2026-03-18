import { BrowserWindow, Menu } from "electron";
import {
  IPC_CHANNELS,
  type ChatTreeChildrenSlice,
  type ChatTreeSnapshot,
  type ChatTreeUiState,
} from "@shared/ipc";
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

  registerInvokeHandler<
    [string, string],
    "add-folder" | "add-chat" | "open-in-new-tab" | "rename" | "delete" | null
  >(context, registeredChannels, {
    channel: IPC_CHANNELS.chatTree.showContextMenu,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      if (typeof args[0] !== "string") {
        throw AppError.badRequest("itemId must be a string.");
      }
      if (args[1] !== "folder" && args[1] !== "chat") {
        throw AppError.badRequest("itemKind must be 'folder' or 'chat'.");
      }
      return [args[0], args[1]];
    },
    handler: (_context, event, _itemId, itemKind) => {
      return new Promise<
        "add-folder" | "add-chat" | "open-in-new-tab" | "rename" | "delete" | null
      >((resolve) => {
        let selected: "add-folder" | "add-chat" | "open-in-new-tab" | "rename" | "delete" | null =
          null;

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
          ...(itemKind === "chat"
            ? ([
                {
                  label: "Open in New Tab",
                  click: () => {
                    selected = "open-in-new-tab";
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
  });
}
