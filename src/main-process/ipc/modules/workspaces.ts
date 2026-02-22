import { IPC_CHANNELS, type WorkspaceInfo } from "../../../shared/ipc";
import { parseWorkspaceId } from "../../../shared/workspace/workspace-id";
import { parseWorkspaceName } from "../../../shared/workspace/workspace-name";
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
  const parsedId = parseWorkspaceId(input);
  if (!parsedId.ok) {
    throw AppError.badRequest(parsedId.error);
  }

  return parsedId.value;
}

function parseValidWorkspaceName(input: unknown): string {
  const parsedName = parseWorkspaceName(input);
  if (!parsedName.ok) {
    throw AppError.badRequest(parsedName.error);
  }

  return parsedName.value;
}

export function registerWorkspaceIpcModule(
  context: IpcHandlerContext,
  registeredChannels: Set<string>,
): void {
  registerInvokeHandler<[], WorkspaceInfo[]>(context, registeredChannels, {
    channel: IPC_CHANNELS.workspaces.list,
    parseArgs: (args) => {
      expectArgCount(args, 0);
      return [];
    },
    handler: ({ services }) => services.workspaces.listWorkspaces(),
  });

  registerInvokeHandler<[], WorkspaceInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.workspaces.getActive,
    parseArgs: (args) => {
      expectArgCount(args, 0);
      return [];
    },
    handler: ({ services }) => services.workspaces.getActiveWorkspace(),
  });

  registerInvokeHandler<[string], WorkspaceInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.workspaces.create,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidWorkspaceName(args[0])];
    },
    handler: ({ services }, _event, name) => services.workspaces.createWorkspace(name),
  });

  registerInvokeHandler<[string], WorkspaceInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.workspaces.setActive,
    parseArgs: (args) => {
      expectArgCount(args, 1);
      return [parseValidWorkspaceId(args[0])];
    },
    handler: ({ services }, _event, id) => services.workspaces.setActiveWorkspace(id),
  });

  registerInvokeHandler<[string, string], WorkspaceInfo>(context, registeredChannels, {
    channel: IPC_CHANNELS.workspaces.updateName,
    parseArgs: (args) => {
      expectArgCount(args, 2);
      return [parseValidWorkspaceId(args[0]), parseValidWorkspaceName(args[1])];
    },
    handler: ({ services }, _event, id, name) => services.workspaces.updateWorkspaceName(id, name),
  });
}
