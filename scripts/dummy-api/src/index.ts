import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/0.1/providers", (c) => {
  // Dummy list of AI providers
  const providers = [
    {
      id: "c_api.hyperbolic.xyz",

      maintained_by: "community",
      is_official: false,

      host: "api.hyperbolic.xyz",
      provider_name: "Hyperbolic",
    },
    {
      id: "o_api.openai.com",

      maintained_by: "official",
      is_official: true,

      host: "api.openai.com",
      provider_name: "OpenAI",
    },
  ];

  return c.json(providers);
});

// New endpoint for provider models
app.get("/0.1/providers/:providerId/models", (c) => {
  const providerId = c.req.param("providerId");
  // Dummy model list - just IDs for now
  // In a real scenario, you'd fetch models based on the providerId
  const models = [
    {
      id: "1",
      provider_model_id: "meta-llama/Llama-3.3-70B-Instruct",
      display_name: "Llama 3.3 70B Instruct",
      description:
        "A 70B parameter model from the Llama family, optimized for research.",

      context_length: 8192,

      family: "Llama",
      created_by: "Meta AI",
    },
  ];
  return c.json(models);
});

export default app;
