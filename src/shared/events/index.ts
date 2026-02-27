export const SYSTEM_EVENT_CHANNEL = "system:event" as const;
export const SYSTEM_STATE_CHANNEL = "system:getState" as const;

export type AiServerEvent =
  | { type: "ai-server:starting" }
  | { type: "ai-server:ready"; port: number }
  | { type: "ai-server:error"; error: string };

export type ProviderModelSyncStatus = "succeeded" | "failed";

export interface ProviderModelsSyncCompletedEvent {
  type: "providers:model-sync:completed";
  providerId: string;
  status: ProviderModelSyncStatus;
}

export type SystemEvent = AiServerEvent | ProviderModelsSyncCompletedEvent;

export interface AiServerStateSnapshot {
  status: "idle" | "starting" | "ready" | "error";
  port: number | null;
  error: string | null;
}

export interface SystemState {
  aiServer: AiServerStateSnapshot;
}
