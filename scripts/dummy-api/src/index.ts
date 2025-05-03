import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

type Provider = {
  id: string;
  is_official: boolean;
  host: string;
  base_path?: string;
  chat_completion_path?: string;
  display_name: string;
  metadata: {
    description: string;
    website_url: string | null;
    github_url: string | null;
    maintainers: string[];
  };
};

type Model = {
  id: string;
  model_id: string;
  display_name: string;
  metadata: {
    description?: string;
  };
};

const providers: (Provider & { models: Model[] })[] = [
  {
    id: "c_api.hyperbolic.xyz",
    is_official: false,
    host: "api.hyperbolic.xyz",
    base_path: "/v1",
    chat_completion_path: "/chat/completions",
    display_name: "Hyperbolic",
    metadata: {
      description:
        "Hyperbolic is a platform for building and deploying AI agents.",
      website_url: "https://hyperbolic.xyz",
      github_url: null,
      maintainers: [],
    },
    models: [
      {
        id: "m_api.hyperbolic.xyz",
        model_id: "hyperbolic/hyperbolic-3.3-70b-instruct",
        display_name: "Hyperbolic 3.3 70B Instruct",
        metadata: {
          description: "Hyperbolic 3.3 70B Instruct",
        },
      },
    ],
  },
  {
    id: "c_ollama",
    is_official: false,
    host: "127.0.0.1:11434",
    base_path: "/api",
    chat_completion_path: "/chat",
    display_name: "Ollama",
    metadata: {
      description: "Ollama is a platform for building and deploying AI agents.",
      website_url: "https://ollama.com",
      github_url: null,
      maintainers: [],
    },
    models: [
      {
        id: "m_ollama",
        model_id: "llama3.1:8b",
        display_name: "Ollama 3.1 8B",
        metadata: {},
      },
      {
        id: "m_ollama",
        model_id: "gemma3:1b",
        display_name: "Gemma 3 1B",
        metadata: {},
      },
    ],
  },
];

app.get("/0.1/providers", (c) => {
  return c.json(providers.map(({ models, ...provider }) => provider));
});

// New endpoint for provider models
app.get("/0.1/providers/:providerId/models", (c) => {
  const providerId = c.req.param("providerId");
  const provider = providers.find((p) => p.id === providerId);

  if (!provider) {
    return c.json({ error: "Provider not found" }, 404);
  }

  return c.json(provider.models);
});

export default app;
