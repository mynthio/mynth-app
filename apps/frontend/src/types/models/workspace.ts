import { DateTime } from '../common'

/**
 * Represents a workspace in the application
 * Maps to Workspace struct in Rust backend
 */
export interface Workspace {
  id: string
  name: string
  createdAt?: DateTime
  updatedAt?: DateTime
}

/**
 * Parameters for updating a workspace
 * Maps to UpdateWorkspaceParams in Rust backend
 */
interface UpdateWorkspaceParams {
  name?: string
}

/**
 * Parameters for creating a workspace
 * Maps to CreateWorkspaceParams in Rust backend
 */
interface CreateWorkspaceParams {
  name: string
}
