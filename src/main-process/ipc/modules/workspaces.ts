import { IPC_CHANNELS, type WorkspaceInfo, type WorkspaceUpdateInput } from "../../../shared/ipc";
import { parseWorkspaceColor } from "../../../shared/workspace/workspace-color";
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

function parseValidWorkspaceColor(input: unknown): string {
  const parsedColor = parseWorkspaceColor(input);
  if (!parsedColor.ok) {
    throw AppError.badRequest(parsedColor.error);
  }

  return parsedColor.value;
}

function parseWorkspaceUpdateInput(args: unknown[]): [string, WorkspaceUpdateInput] {
  expectArgCount(args, 2);

  const workspaceId = parseValidWorkspaceId(args[0]);
  const rawInput = args[1];

  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    throw AppError.badRequest("Workspace update payload must be an object.");
  }

  const inputRecord = rawInput as Record<string, unknown>;
  const allowedKeys = new Set(["name", "color"]);
  for (const key of Object.keys(inputRecord)) {
    if (!allowedKeys.has(key)) {
      throw AppError.badRequest(`Unsupported workspace update field "${key}".`);
    }
  }

  const parsedInput: WorkspaceUpdateInput = {};

  if (inputRecord.name !== undefined) {
    parsedInput.name = parseValidWorkspaceName(inputRecord.name);
  }

  if (inputRecord.color !== undefined) {
    parsedInput.color = parseValidWorkspaceColor(inputRecord.color);
  }

  return [workspaceId, parsedInput];
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

  registerInvokeHandler<[string, WorkspaceUpdateInput], WorkspaceInfo>(
    context,
    registeredChannels,
    {
      channel: IPC_CHANNELS.workspaces.update,
      parseArgs: parseWorkspaceUpdateInput,
      handler: ({ services }, _event, id, input) => services.workspaces.updateWorkspace(id, input),
    },
  );
}
