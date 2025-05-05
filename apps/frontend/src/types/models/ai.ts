import { DateTime } from '../common'

/**
 * Represents an AI integration in the application
 * Maps to AiIntegration struct in Rust backend
 */
export interface AIIntegration {
  id: string
  mynthId?: string
  displayName: string
  host: string
  basePath?: string
  apiKeyId?: string
  isEnabled: boolean
  isCustom: boolean
  marketplaceIntegrationId?: string
  settings?: string
  updatedAt?: DateTime
}

/**
 * Represents an AI model in the application
 * Maps to AiModel struct in Rust backend
 */
export interface AIModel {
  id: string
  modelId: string
  mynthModelId?: string
  displayName?: string
  path?: string
  isCustom: boolean
  capabilities?: string
  tags?: string
  metadata?: string
  maxContextSize?: number
  costPerInputToken?: number
  costPerOutputToken?: number
  settings?: string
  integrationId: string
  updatedAt?: DateTime
}
