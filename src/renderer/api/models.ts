import "../lib/electron-api";
import type { UpdateModelInput } from "../../shared/ipc";

export const modelsApi = {
  update(modelId: string, input: UpdateModelInput) {
    return window.electronAPI.updateModel(modelId, input);
  },

  setProviderEnabled(providerId: string, isEnabled: boolean) {
    return window.electronAPI.setProviderModelsEnabled(providerId, isEnabled);
  },
};
