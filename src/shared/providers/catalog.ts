export type ProviderId = "openrouter" | "ollama";

export interface ProviderHostPortConfigValue {
  host: string;
  port: number;
}

export interface ProviderConfigSecretFieldDefinition {
  type: "secret";
  required?: boolean;
  label: string;
  description?: string;
  placeholder?: string;
}

export interface ProviderConfigHostPortFieldDefinition {
  type: "host+port";
  required?: boolean;
  label: string;
  description?: string;
  defaultHost?: string;
  defaultPort?: number;
}

export type ProviderConfigFieldDefinition =
  | ProviderConfigSecretFieldDefinition
  | ProviderConfigHostPortFieldDefinition;

export interface SupportedProviderDefinition {
  id: ProviderId;
  name: string;
  description: string;
  isAvailable: boolean;
  supportsCredentialTest: boolean;
  configFields: Record<string, ProviderConfigFieldDefinition>;
}

export const SUPPORTED_PROVIDERS: readonly SupportedProviderDefinition[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Use OpenRouter API keys to access models from multiple providers.",
    isAvailable: true,
    supportsCredentialTest: true,
    configFields: {
      apiKey: {
        type: "secret",
        required: true,
        label: "API Key",
        description: "OpenRouter API Key from dashboard",
        placeholder: "Enter your OpenRouter API key",
      },
    },
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Use a local or remote Ollama server for model inference.",
    isAvailable: true,
    supportsCredentialTest: true,
    configFields: {
      endpoint: {
        type: "host+port",
        required: true,
        label: "Host and Port",
        description: "Connection details for your Ollama API server.",
        defaultHost: "127.0.0.1",
        defaultPort: 11434,
      },
    },
  },
] as const;

export function getSupportedProviderById(
  providerId: string,
): SupportedProviderDefinition | undefined {
  return SUPPORTED_PROVIDERS.find((provider) => provider.id === providerId);
}
