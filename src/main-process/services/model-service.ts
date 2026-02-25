import type { ProviderModelInfo, UpdateModelInput, UpdateModelResult } from "../../shared/ipc";
import { updateModel as updateModelRepo } from "../models/repository";
import { AppError } from "../ipc/core/errors";

export interface ModelService {
  updateModel(modelId: string, input: UpdateModelInput): UpdateModelResult;
}

export function createModelService(): ModelService {
  return {
    updateModel(modelId, input) {
      const updated = updateModelRepo(modelId, input);
      if (!updated) {
        throw AppError.notFound(`Model "${modelId}" not found.`);
      }

      return {
        id: updated.id,
        providerId: updated.providerId,
        providerModelId: updated.providerModelId,
        displayName: updated.displayName,
        isEnabled: updated.isEnabled,
        status: updated.lifecycleStatus as ProviderModelInfo["status"],
      };
    },
  };
}
