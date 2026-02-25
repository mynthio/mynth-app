import {
  getSupportedProviderById,
  type SupportedProviderDefinition,
} from "../../shared/providers/catalog";
import { decryptString } from "../services/safe-storage";
import type { ProviderTableRow } from "./repository";

export type ParsedProviderRuntimeConfig = Record<string, string>;

export interface ResolvedProviderRuntimeContext {
  providerDef: SupportedProviderDefinition;
  parsedConfig: ParsedProviderRuntimeConfig;
}

interface StoredSecretConfigValue {
  $secret: string;
}

export function resolveProviderRuntimeContext(
  providerRow: ProviderTableRow,
): ResolvedProviderRuntimeContext {
  const providerDef = getSupportedProviderById(providerRow.catalogId);
  if (!providerDef || !providerDef.isAvailable) {
    throw new Error(`Provider "${providerRow.catalogId}" is not available.`);
  }

  return {
    providerDef,
    parsedConfig: parseStoredProviderConfig(providerDef, providerRow.config),
  };
}

export function parseStoredProviderConfig(
  providerDef: SupportedProviderDefinition,
  storedConfigJson: string,
): ParsedProviderRuntimeConfig {
  const parsedConfig = parseStoredConfigObject(providerDef.id, storedConfigJson);
  const allowedKeys = new Set(Object.keys(providerDef.configFields));

  for (const key of Object.keys(parsedConfig)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Unsupported stored config field "${key}" for provider "${providerDef.id}".`);
    }
  }

  const runtimeConfig: ParsedProviderRuntimeConfig = {};

  for (const [key, field] of Object.entries(providerDef.configFields)) {
    switch (field.type) {
      case "secret": {
        const rawValue = parsedConfig[key];

        if (rawValue == null) {
          if (field.required) {
            throw new Error(`Missing required stored config field "${key}".`);
          }
          continue;
        }

        if (!isStoredSecretConfigValue(rawValue)) {
          throw new Error(`Stored secret field "${key}" has invalid format.`);
        }

        let decrypted: string;
        try {
          decrypted = decryptString(rawValue.$secret);
        } catch (error) {
          throw new Error(`Failed to decrypt stored config field "${key}".`, { cause: error });
        }

        if (!decrypted && field.required) {
          throw new Error(`Stored config field "${key}" is empty after decryption.`);
        }

        runtimeConfig[key] = decrypted;
        break;
      }
    }
  }

  return runtimeConfig;
}

function parseStoredConfigObject(providerId: string, raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Stored config for provider "${providerId}" is not valid JSON.`, {
      cause: error,
    });
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Stored config for provider "${providerId}" must be an object.`);
  }

  return parsed as Record<string, unknown>;
}

function isStoredSecretConfigValue(value: unknown): value is StoredSecretConfigValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const secret = (value as { $secret?: unknown }).$secret;
  return typeof secret === "string" && secret.length > 0;
}
