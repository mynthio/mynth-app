import { IPC_CHANNELS, type IpcApi } from "../../shared/ipc";
import { invokeIpc } from "../invoke";

type ModelsApi = Pick<IpcApi, "updateModel">;

export function createModelsApi(): ModelsApi {
  return {
    updateModel: (modelId, input) => invokeIpc(IPC_CHANNELS.models.update, modelId, input),
  };
}
