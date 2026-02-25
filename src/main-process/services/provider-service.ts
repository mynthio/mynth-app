/**
 * Provider credential tests are implemented per provider method on purpose.
 * Each provider function should own its endpoint URL, timeout, request shape,
 * and response/status interpretation so adding new providers does not create
 * shared abstractions that leak provider-specific behavior.
 */
import type {
  ProviderInfo,
  ProviderCredentialTestInput,
  ProviderCredentialTestResult,
  ProviderModelInfo,
  SaveProviderInput,
  SaveProviderResult,
} from "../../shared/ipc";
import {
  getSupportedProviderById,
  type ProviderId,
  type SupportedProviderDefinition,
} from "../../shared/providers/catalog";
import { createUuidV7 } from "../db/uuidv7";
import {
  listModelsByProviderId,
  syncProviderModels,
  type SyncProviderModelInput,
} from "../models/repository";
import {
  createProvider,
  getProviderById,
  listProviders as listStoredProviders,
  updateProviderMetadataModelSync,
  updateProviderModelsSyncStatus,
  type ProviderTableRow,
} from "../providers/repository";
import { resolveProviderRuntimeContext } from "../providers/runtime-config";
import { AppError } from "../ipc/core/errors";
import { encryptString, isEncryptionAvailable } from "./safe-storage";

export interface ProviderService {
  listProviders(): ProviderInfo[];
  listProviderModels(providerId: string): ProviderModelInfo[];
  testCredentials(input: ProviderCredentialTestInput): Promise<ProviderCredentialTestResult>;
  saveProvider(input: SaveProviderInput): SaveProviderResult;
}

export function createProviderService(): ProviderService {
  const inFlightModelSyncProviderIds = new Set<string>();

  return {
    listProviders() {
      return listStoredProviders().map((row) => ({
        id: row.id,
        displayName: row.displayName,
        catalogId: row.catalogId as ProviderId,
      }));
    },

    listProviderModels(providerId) {
      return listModelsByProviderId(providerId).map((row) => ({
        id: row.id,
        providerId: row.providerId,
        providerModelId: row.providerModelId,
        displayName: row.displayName,
        isEnabled: row.isEnabled,
        status: row.lifecycleStatus as ProviderModelInfo["status"],
      }));
    },

    async testCredentials(input) {
      const provider = getSupportedProviderById(input.providerId);
      if (!provider || !provider.isAvailable) {
        throw AppError.notFound(`Provider "${input.providerId}" is not available.`);
      }

      if (!provider.supportsCredentialTest) {
        throw AppError.badRequest(
          `Provider "${input.providerId}" does not support credential testing.`,
        );
      }

      const config = parseProviderDraftConfig(provider, input.config);

      switch (input.providerId) {
        case "openrouter":
          return testOpenRouterCredentials(getRequiredDraftConfigValue(config, "apiKey"));
      }
    },

    saveProvider(input) {
      const catalogEntry = getSupportedProviderById(input.catalogId);
      if (!catalogEntry || !catalogEntry.isAvailable) {
        throw AppError.notFound(`Provider "${input.catalogId}" is not available.`);
      }

      const config = parseProviderDraftConfig(catalogEntry, input.config);

      if (!isEncryptionAvailable()) {
        throw AppError.internal("Encryption is not available. Cannot securely store credentials.");
      }
      const id = createUuidV7();
      const displayName = input.displayName?.trim() || catalogEntry.name;

      const row = createProvider({
        id,
        displayName,
        catalogId: input.catalogId,
        config: buildStoredProviderConfig(catalogEntry, config),
      });

      void syncProviderModelsInBackground(row.id);

      return {
        id: row.id,
        displayName: row.displayName,
        catalogId: row.catalogId as ProviderId,
      };
    },
  };

  async function syncProviderModelsInBackground(providerId: string): Promise<void> {
    if (inFlightModelSyncProviderIds.has(providerId)) {
      return;
    }

    inFlightModelSyncProviderIds.add(providerId);
    try {
      await runProviderModelSync(providerId);
    } catch (error) {
      console.error(`Provider model sync crashed for provider "${providerId}".`, error);
    } finally {
      inFlightModelSyncProviderIds.delete(providerId);
    }
  }
}

type ProviderDraftConfig = Record<string, string>;

interface StoredSecretConfigValue {
  $secret: string;
}

function parseProviderDraftConfig(
  provider: SupportedProviderDefinition,
  rawConfig: Record<string, unknown>,
): ProviderDraftConfig {
  const config = rawConfig;
  const allowedKeys = new Set(Object.keys(provider.configFields));

  for (const key of Object.keys(config)) {
    if (!allowedKeys.has(key)) {
      throw AppError.badRequest(`Unsupported config field "${key}" for provider "${provider.id}".`);
    }
  }

  const draft: ProviderDraftConfig = {};

  for (const [key, field] of Object.entries(provider.configFields)) {
    switch (field.type) {
      case "secret": {
        const rawValue = config[key];

        if (rawValue == null || rawValue === "") {
          if (field.required) {
            throw AppError.badRequest(`${field.label} is required.`);
          }
          continue;
        }

        if (typeof rawValue !== "string") {
          throw AppError.badRequest(`${field.label} must be a string.`);
        }

        const value = rawValue.trim();
        if (!value) {
          if (field.required) {
            throw AppError.badRequest(`${field.label} is required.`);
          }
          continue;
        }

        draft[key] = value;
        break;
      }
    }
  }

  return draft;
}

function buildStoredProviderConfig(
  provider: SupportedProviderDefinition,
  draftConfig: ProviderDraftConfig,
): Record<string, unknown> {
  const storedConfig: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(provider.configFields)) {
    const value = draftConfig[key];
    if (!value) {
      continue;
    }

    switch (field.type) {
      case "secret": {
        const secretValue: StoredSecretConfigValue = {
          $secret: encryptString(value),
        };
        storedConfig[key] = secretValue;
        break;
      }
    }
  }

  return storedConfig;
}

function getRequiredDraftConfigValue(config: ProviderDraftConfig, key: string): string {
  const value = config[key];
  if (!value) {
    throw AppError.badRequest(`Missing required config field "${key}".`);
  }
  return value;
}

async function runProviderModelSync(providerId: string): Promise<void> {
  const providerRow = getProviderById(providerId);
  if (!providerRow) {
    return;
  }

  const startedAt = Date.now();
  updateProviderModelsSyncStatus(providerId, "syncing");
  updateProviderMetadataModelSync(providerId, {
    error: null,
    started_at: startedAt,
    ended_at: null,
    duration: null,
  });

  try {
    const { providerDef, parsedConfig } = resolveProviderRuntimeContext(providerRow);
    const normalizedModels = await fetchModelsForProviderSync({
      providerRow,
      providerDef,
      parsedConfig,
    });

    syncProviderModels(providerId, normalizedModels);

    const endedAt = Date.now();
    updateProviderModelsSyncStatus(providerId, "succeeded");
    updateProviderMetadataModelSync(providerId, {
      error: null,
      ended_at: endedAt,
      duration: endedAt - startedAt,
    });
  } catch (error) {
    const endedAt = Date.now();
    updateProviderModelsSyncStatus(providerId, "failed");
    updateProviderMetadataModelSync(providerId, {
      error: formatModelSyncErrorMessage(error),
      ended_at: endedAt,
      duration: endedAt - startedAt,
    });

    console.error(`Provider model sync failed for provider "${providerId}".`, error);
  }
}

interface ProviderModelSyncHandlerInput {
  providerRow: ProviderTableRow;
  providerDef: SupportedProviderDefinition;
  parsedConfig: Record<string, string>;
}

async function fetchModelsForProviderSync(
  input: ProviderModelSyncHandlerInput,
): Promise<SyncProviderModelInput[]> {
  switch (input.providerDef.id) {
    case "openrouter":
      return fetchOpenRouterModelsForSync(input);
  }
}

async function fetchOpenRouterModelsForSync({
  parsedConfig,
}: ProviderModelSyncHandlerInput): Promise<SyncProviderModelInput[]> {
  const apiKey = getRequiredParsedConfigValue(parsedConfig, "apiKey");
  const endpoint = "https://openrouter.ai/api/v1/models";
  const timeoutMs = 15_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter model fetch failed with status ${response.status}.`);
    }

    const body = (await response.json()) as unknown;
    const data = extractOpenRouterModelsArray(body);
    const seenProviderModelIds = new Set<string>();
    const normalized: SyncProviderModelInput[] = [];

    for (const rawModel of data) {
      if (!rawModel || typeof rawModel !== "object" || Array.isArray(rawModel)) {
        continue;
      }

      const providerModelId = readTrimmedString((rawModel as Record<string, unknown>).id);
      if (!providerModelId || seenProviderModelIds.has(providerModelId)) {
        continue;
      }

      seenProviderModelIds.add(providerModelId);

      const displayName = readTrimmedString((rawModel as Record<string, unknown>).name) ?? null;
      const lifecycleStatus =
        (rawModel as Record<string, unknown>).deprecated === true ||
        (rawModel as Record<string, unknown>).archived === true
          ? "deprecated"
          : "active";

      normalized.push({
        providerModelId,
        canonicalModelId: "unknown",
        displayName,
        metadata: rawModel as Record<string, unknown>,
        lifecycleStatus,
      });
    }

    return normalized;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("OpenRouter model fetch timed out.", { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractOpenRouterModelsArray(body: unknown): unknown[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("OpenRouter model response must be an object.");
  }

  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new Error("OpenRouter model response is missing a data array.");
  }

  return data;
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getRequiredParsedConfigValue(config: Record<string, string>, key: string): string {
  const value = config[key];
  if (!value) {
    throw new Error(`Missing required parsed config field "${key}".`);
  }
  return value;
}

function formatModelSyncErrorMessage(error: unknown): string {
  const maxLength = 1000;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  return message.length > maxLength ? `${message.slice(0, maxLength - 3)}...` : message;
}

async function testOpenRouterCredentials(apiKey: string): Promise<ProviderCredentialTestResult> {
  const endpoint = "https://openrouter.ai/api/v1/key";
  const timeoutMs = 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (response.ok) {
      return {
        providerId: "openrouter",
        ok: true,
        message: "OpenRouter API key is valid.",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        providerId: "openrouter",
        ok: false,
        message: "OpenRouter rejected the API key.",
      };
    }

    return {
      providerId: "openrouter",
      ok: false,
      message: `OpenRouter credential test failed with status ${response.status}.`,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        providerId: "openrouter",
        ok: false,
        message: "OpenRouter credential test timed out.",
      };
    }

    if (error instanceof Error) {
      return {
        providerId: "openrouter",
        ok: false,
        message: `OpenRouter credential test failed: ${error.message}`,
      };
    }

    return {
      providerId: "openrouter",
      ok: false,
      message: "OpenRouter credential test failed due to an unknown error.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
