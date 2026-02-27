import type { LanguageModel } from "ai";
import type { ProviderId } from "../../../shared/providers/catalog";
import type { CreateLanguageModelInput, LanguageModelResolver } from "./language-model-types";
import { createOllamaLanguageModel } from "./resolvers/ollama-language-model";
import { createOpenRouterLanguageModel } from "./resolvers/openrouter-language-model";

const languageModelResolvers = {
  ollama: createOllamaLanguageModel,
  openrouter: createOpenRouterLanguageModel,
} satisfies Record<ProviderId, LanguageModelResolver>;

export function createLanguageModel(input: CreateLanguageModelInput): LanguageModel {
  if (input.providerRow.catalogId !== input.providerRuntime.providerDef.id) {
    throw new Error(
      `Provider runtime context mismatch for provider row "${input.providerRow.id}".`,
    );
  }

  return languageModelResolvers[input.providerRuntime.providerDef.id](input);
}
