export type ProviderId = "openrouter";

export interface ProviderConfigSecretFieldDefinition {
  type: "secret";
  required?: boolean;
  label: string;
  description?: string;
  placeholder?: string;
}

export type ProviderConfigFieldDefinition = ProviderConfigSecretFieldDefinition;

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
] as const;

export function getSupportedProviderById(
  providerId: string,
): SupportedProviderDefinition | undefined {
  return SUPPORTED_PROVIDERS.find((provider) => provider.id === providerId);
}
