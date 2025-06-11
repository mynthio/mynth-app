import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Based on MarketplaceApiProvider from dtos.rs
type Provider = {
  id: string;
  isOfficial: boolean; // was is_official
  baseUrl: string; // was base_url
  compatibility: string;
  authType: string; // was auth_type
  authConfig: string; // was auth_config
  modelsSyncStrategy: string; // was models_sync_strategy
  updatedAt: string; // was updated_at
  createdAt: string; // was created_at
  publishedAt: string; // was published_at
};

// Based on MarketplaceApiProviderModel from dtos.rs
type Model = {
  id: string; // Unique ID for the model entry, e.g., "m_hyperbolic_instruct"
  name: string; // Model identifier, e.g., "hyperbolic/hyperbolic-3.3-70b-instruct" (was model_id)
  displayName: string; // User-friendly display name
  maxInputTokens?: number;
  inputPrice?: number;
  outputPrice?: number;
  tags?: string[];
  jsonConfig?: string;
};

// Based on MarketplaceApiProviderEndpoint from dtos.rs
type ProviderEndpoint = {
  id: string;
  displayName?: string;
  type: string; // 'type' in TS, was r#type in Rust
  path: string;
  method: string;
  jsonRequestSchema?: string;
  jsonResponseSchema?: string;
  streaming: boolean;
  priority?: number;
  jsonConfig?: string;
};

// Combined structure for the main data array
type ProviderEntry = Provider & {
  models: Model[];
  providerEndpoints: ProviderEndpoint[];
};

// Based on MarketplaceApiProviderIntegration from dtos.rs
type ProviderIntegration = {
  provider: Provider;
  providerEndpoints: ProviderEndpoint[];
  models: Model[];
};

const providers: ProviderEntry[] = [
  {
    id: "c_api.hyperbolic.xyz",
    isOfficial: false,
    baseUrl: "api.hyperbolic.xyz", // was base_url
    compatibility: "open_ai",
    authType: "bearer", // was auth_type
    authConfig: "Bearer <token>", // was auth_config
    modelsSyncStrategy: "mynth", // was models_sync_strategy
    updatedAt: "2021-01-01", // was updated_at
    createdAt: "2021-01-01", // was created_at
    publishedAt: "2021-01-01", // was published_at
    models: [
      {
        id: "m_hyperbolic_instruct", // Unique model ID
        name: "hyperbolic/hyperbolic-3.3-70b-instruct", // was model_id
        displayName: "Hyperbolic 3.3 70B Instruct", // was display_name
        maxInputTokens: 4096,
        inputPrice: 0.001,
        outputPrice: 0.003,
        tags: ["official", "instruct"],
        jsonConfig: JSON.stringify({ recommended: true }),
      },
    ],
    providerEndpoints: [
      {
        id: "ep_hyperbolic_chat",
        displayName: "Chat Completions",
        type: "chat",
        path: "/v1/chat/completions",
        method: "POST",
        streaming: true,
        priority: 1,
      },
    ],
  },
  {
    id: "c_ollama",
    isOfficial: false,
    baseUrl: "127.0.0.1:11434", // was base_url
    compatibility: "ollama",
    authType: "none", // was auth_type, assuming none if local
    authConfig: "", // was auth_config
    modelsSyncStrategy: "mynth", // was models_sync_strategy
    updatedAt: "2021-01-01", // was updated_at
    createdAt: "2021-01-01", // was created_at
    publishedAt: "2021-01-01", // was published_at
    models: [
      {
        id: "m_ollama_llama3.1_8b", // Unique model ID
        name: "llama3.1:8b", // was model_id
        displayName: "Ollama Llama 3.1 8B", // was display_name
        maxInputTokens: 8192,
        tags: ["local", "experimental"],
      },
      {
        id: "m_ollama_gemma3_1b", // Unique model ID
        name: "gemma2:2b", // was model_id, updated to reflect a different model for variety
        displayName: "Ollama Gemma2 2B", // was display_name
        maxInputTokens: 2048,
        tags: ["local"],
      },
    ],
    providerEndpoints: [
      {
        id: "ep_ollama_generate",
        type: "completion",
        path: "/api/generate",
        method: "POST",
        streaming: true,
      },
      {
        id: "ep_ollama_chat",
        type: "chat",
        path: "/api/chat",
        method: "POST",
        streaming: true,
      },
    ],
  },
];

// Endpoint to list all providers (summary: Provider type)
app.get("/0.1/providers", (c) => {
  return c.json(
    providers.map(({ models, providerEndpoints, ...provider }) => provider)
  );
});

// New endpoint to get a single provider's details (Provider type)
app.get("/0.1/providers/:providerId", (c) => {
  const providerId = c.req.param("providerId");
  const providerEntry = providers.find((p) => p.id === providerId);

  if (!providerEntry) {
    return c.json({ error: "Provider not found" }, 404);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { models, providerEndpoints, ...providerDetails } = providerEntry;
  return c.json(providerDetails);
});

// Endpoint for a provider's models (Model type array)
app.get("/0.1/providers/:providerId/models", (c) => {
  const providerId = c.req.param("providerId");
  const providerEntry = providers.find((p) => p.id === providerId);

  if (!providerEntry) {
    return c.json({ error: "Provider not found" }, 404);
  }

  return c.json(providerEntry.models);
});

// New endpoint for provider integration details (ProviderIntegration type)
app.get("/0.1/providers/:providerId/integration", (c) => {
  const providerId = c.req.param("providerId");
  const providerEntry = providers.find((p) => p.id === providerId);

  if (!providerEntry) {
    return c.json({ error: "Provider not found" }, 404);
  }

  const { models, providerEndpoints, ...providerDetails } = providerEntry;
  const integrationData: ProviderIntegration = {
    provider: providerDetails,
    models: models,
    providerEndpoints: providerEndpoints,
  };

  return c.json(integrationData);
});

export default app;
