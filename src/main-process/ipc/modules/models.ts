import { IPC_CHANNELS, type UpdateModelInput, type UpdateModelResult } from "../../../shared/ipc";
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

function parseUpdateModelInput(args: unknown[]): [string, UpdateModelInput] {
  expectArgCount(args, 2);

  const modelId = args[0];
  if (typeof modelId !== "string" || !modelId.trim()) {
    throw AppError.badRequest("modelId must be a non-empty string.");
  }

  const rawInput = args[1];
  if (!rawInput || typeof rawInput !== "object") {
    throw AppError.badRequest("Update model input must be an object.");
  }

  const input: UpdateModelInput = {};
  const isEnabled = (rawInput as { isEnabled?: unknown }).isEnabled;
  const displayName = (rawInput as { displayName?: unknown }).displayName;

  if (isEnabled !== undefined) {
    if (typeof isEnabled !== "boolean") {
      throw AppError.badRequest("isEnabled must be a boolean.");
    }
    input.isEnabled = isEnabled;
  }

  if (displayName !== undefined) {
    if (displayName !== null && typeof displayName !== "string") {
      throw AppError.badRequest("displayName must be a string or null.");
    }
    input.displayName = displayName;
  }

  return [modelId, input];
}

export function registerModelsIpcModule(
  context: IpcHandlerContext,
  registeredChannels: Set<string>,
): void {
  registerInvokeHandler<[string, UpdateModelInput], UpdateModelResult>(
    context,
    registeredChannels,
    {
      channel: IPC_CHANNELS.models.update,
      parseArgs: parseUpdateModelInput,
      handler: ({ services }, _event, modelId, input) =>
        services.models.updateModel(modelId, input),
    },
  );
}
