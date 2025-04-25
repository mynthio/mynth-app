import { DateTime } from "../common";

/**
 * Represents an AI integration in the application
 * Maps to AIIntegration struct in Rust backend
 */
export interface AIIntegration {
  id: string;
  name: string;
  baseHost: string;
  basePath: string;
  apiKey?: string;
  isEnabled: boolean;
  origin: string;
  marketplaceIntegrationId?: string;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

/**
 * Represents an AI model in the application
 * Maps to AIModel struct in Rust backend
 */
export interface AIModel {
  id: string;
  modelId: string;
  mynthModelId?: string;
  origin: string;
  integrationId: string;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

/**
 * Represents an AI integration with its related models
 */
interface AIIntegrationWithModels extends AIIntegration {
  models: AIModel[];
}
