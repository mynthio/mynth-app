import type { ComponentType, SVGProps } from "react";
import type { ProviderId } from "../../../shared/providers/catalog";
import { OllamaIcon } from "./ollama-icon";
import { OpenRouterIcon } from "./openrouter-icon";

export type ProviderIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const providerIconsById = {
  ollama: OllamaIcon,
  openrouter: OpenRouterIcon,
} satisfies Record<ProviderId, ProviderIconComponent>;

export function getProviderIconById(providerId: ProviderId): ProviderIconComponent {
  return providerIconsById[providerId];
}
