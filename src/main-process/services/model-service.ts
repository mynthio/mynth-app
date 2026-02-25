import type {
  ProviderModelInfo,
  SetProviderModelsEnabledResult,
  UpdateModelInput,
  UpdateModelResult,
} from "../../shared/ipc";
import { updateModel as updateModelRepo, updateModelsByProviderId } from "../models/repository";
import { AppError } from "../ipc/core/errors";

export interface ModelService {
  updateModel(modelId: string, input: UpdateModelInput): UpdateModelResult;
  setProviderModelsEnabled(providerId: string, isEnabled: boolean): SetProviderModelsEnabledResult;
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

    setProviderModelsEnabled(providerId, isEnabled) {
      const result = updateModelsByProviderId(providerId, { isEnabled });

      return {
        providerId,
        isEnabled,
        matchedCount: result.matchedCount,
        updatedCount: result.updatedCount,
      };
    },
  };
}
