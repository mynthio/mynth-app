use std::collections::HashMap;
use std::sync::Arc;
use tracing::{debug, error, info, instrument};
use ulid::Ulid;

use super::database::DbPool;
use crate::models::ai::{AiIntegration, AiModel, CreateAiIntegrationParams, CreateAiModelInput};
use crate::utils::keychain;

// Define a custom error type for better error handling
#[derive(Debug, thiserror::Error)]
pub enum AiServiceError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Integration not found: {0}")]
    NotFound(String),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
}

pub struct AiService {
    pool: Arc<DbPool>,
}

impl AiService {
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }

    /// Creates a new AI integration and optionally associated models in the database within a transaction
    ///
    /// # Arguments
    /// * `params` - Parameters for the new integration, including optional models
    ///
    /// # Returns
    /// * `Ok(String)` - The ID of the newly created integration
    /// * `Err` - If a validation or database error occurs
    #[instrument(skip(self, params), fields(integration_name = %params.name))]
    pub async fn create_integration(
        &self,
        params: CreateAiIntegrationParams,
    ) -> Result<String, AiServiceError> {
        // Validate input parameters
        if params.name.trim().is_empty() {
            return Err(AiServiceError::InvalidParameter(
                "Integration name cannot be empty".to_string(),
            ));
        }

        let integration_id = Ulid::new().to_string();
        info!(
            "Attempting to create AI integration with ID: {}",
            integration_id
        );

        let mut tx = match self.pool.get().begin().await {
            Ok(tx) => tx,
            Err(e) => {
                error!("Failed to begin transaction: {}", e);
                return Err(AiServiceError::Database(e));
            }
        };

        // Insert the integration without api_key as it will be set later
        match sqlx::query!(
            r#"
            INSERT INTO ai_integrations (id, display_name, host, base_path, chat_completion_path, is_enabled, is_custom, updated_at)
            VALUES (?, ?, ?, ?, ?, true, true, CURRENT_TIMESTAMP)
            "#,
            integration_id,
            params.name,
            params.base_host,
            params.base_path,
            params.chat_completion_path
        )
        .execute(&mut *tx)
        .await
        {
            Ok(_) => {
                info!("Successfully inserted integration record: {}", integration_id);
            }
            Err(e) => {
                error!("Failed to insert integration record {}: {}", integration_id, e);
                if let Err(rollback_err) = tx.rollback().await {
                    error!("Failed to rollback transaction: {}", rollback_err);
                }
                return Err(AiServiceError::Database(e));
            }
        };

        // Insert models if provided
        if let Some(models) = params.models {
            info!(
                "Inserting {} models for integration: {}",
                models.len(),
                integration_id
            );
            for model_input in models {
                if model_input.model_id.trim().is_empty() {
                    error!(
                        "Model ID cannot be empty for integration: {}",
                        integration_id
                    );
                    if let Err(rollback_err) = tx.rollback().await {
                        error!("Failed to rollback transaction: {}", rollback_err);
                    }
                    return Err(AiServiceError::InvalidParameter(
                        "Model ID cannot be empty".to_string(),
                    ));
                }

                let model_pk_id = Ulid::new().to_string();
                info!(
                    "Creating AI model with PK ID: {} for integration: {}",
                    model_pk_id, integration_id
                );

                let display_name = model_input
                    .display_name
                    .clone()
                    .unwrap_or_else(|| model_input.model_id.clone());
                let path = model_input.path.clone();
                let capabilities = model_input.capabilities.clone();
                let tags = model_input.tags.clone();

                match sqlx::query!(
                    r#"
                    INSERT INTO ai_models (id, model_id, mynth_model_id, display_name, path, is_custom, capabilities, tags, integration_id, updated_at)
                    VALUES (?, ?, ?, ?, ?, true, ?, ?, ?, CURRENT_TIMESTAMP)
                    "#,
                    model_pk_id,
                    model_input.model_id,
                    model_input.mynth_model_id,
                    display_name,
                    path,
                    capabilities,
                    tags,
                    integration_id
                )
                .execute(&mut *tx)
                .await
                {
                    Ok(_) => {
                        info!("Successfully inserted model: {} for integration: {}", model_pk_id, integration_id);
                    }
                    Err(e) => {
                        error!(
                            "Failed to insert model record {} for integration {}: {}",
                            model_pk_id,
                            integration_id,
                            e
                        );
                        if let Err(rollback_err) = tx.rollback().await {
                             error!("Failed to rollback transaction: {}", rollback_err);
                        }
                        return Err(AiServiceError::Database(e));
                    }
                }
            }
        }

        // Commit the transaction
        match tx.commit().await {
            Ok(_) => {
                info!(
                    "Successfully committed transaction for integration: {}",
                    integration_id
                );
                Ok(integration_id)
            }
            Err(e) => {
                error!(
                    "Failed to commit transaction for integration {}: {}",
                    integration_id, e
                );
                // No need to rollback here, commit failure implies rollback
                Err(AiServiceError::Database(e))
            }
        }
    }

    #[instrument(skip(self), fields(integration_id = %id))]
    pub async fn get_integration(&self, id: &str) -> Result<Option<AiIntegration>, AiServiceError> {
        info!("Fetching AI integration with ID: {}", id);

        if id.trim().is_empty() {
            return Err(AiServiceError::InvalidParameter(
                "Integration ID cannot be empty".to_string(),
            ));
        }

        let integration = match sqlx::query_as!(
            AiIntegration,
            r#"
            SELECT 
                id, display_name, host, base_path, chat_completion_path, api_key_id,
                is_enabled, is_custom, marketplace_integration_id,
                mynth_id, settings,
                updated_at
            FROM ai_integrations
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(self.pool.get())
        .await
        {
            Ok(integration) => integration,
            Err(e) => {
                error!("Failed to fetch AI integration {}: {}", id, e);
                return Err(AiServiceError::Database(e));
            }
        };

        info!(
            "Successfully fetched integration: {}",
            if integration.is_some() {
                "found"
            } else {
                "not found"
            }
        );
        Ok(integration)
    }

    #[instrument(skip(self))]
    pub async fn get_integrations(&self) -> Result<Vec<AiIntegration>, AiServiceError> {
        info!("Fetching all AI integrations");

        let rows = match sqlx::query_as!(
            AiIntegration,
            r#"
            SELECT 
                id, display_name, host, base_path, chat_completion_path, api_key_id,
                is_enabled, is_custom, marketplace_integration_id,
                mynth_id, settings,
                updated_at
            FROM ai_integrations
            ORDER BY id DESC
            "#
        )
        .fetch_all(self.pool.get())
        .await
        {
            Ok(rows) => rows,
            Err(e) => {
                error!("Failed to fetch AI integrations: {}", e);
                return Err(AiServiceError::Database(e));
            }
        };

        info!("Successfully fetched {} integrations", rows.len());
        Ok(rows)
    }

    /// Deletes an AI integration and all associated models in the database within a transaction
    ///
    /// # Arguments
    /// * `id` - The ID of the integration to delete
    ///
    /// # Returns
    /// * `Ok(bool)` - Whether the integration was found and deleted
    /// * `Err` - If a validation or database error occurs
    #[instrument(skip(self), fields(integration_id = %id))]
    pub async fn delete_integration(&self, id: &str) -> Result<bool, AiServiceError> {
        info!("Attempting to delete AI integration with ID: {}", id);

        // Validate input parameters
        if id.trim().is_empty() {
            return Err(AiServiceError::InvalidParameter(
                "Integration ID cannot be empty".to_string(),
            ));
        }

        // Get the integration first to retrieve the api_key_id
        let integration = match self.get_integration(id).await? {
            Some(integration) => integration,
            None => {
                return Ok(false); // Integration not found
            }
        };

        // Start a transaction
        let mut tx = match self.pool.get().begin().await {
            Ok(tx) => tx,
            Err(e) => {
                error!("Failed to begin transaction: {}", e);
                return Err(AiServiceError::Database(e));
            }
        };

        // First delete associated models, then the integration
        match sqlx::query!(r#"DELETE FROM ai_models WHERE integration_id = ?"#, id)
            .execute(&mut *tx)
            .await
        {
            Ok(result) => {
                info!(
                    "Deleted {} models for integration: {}",
                    result.rows_affected(),
                    id
                );
            }
            Err(e) => {
                error!("Failed to delete models for integration {}: {}", id, e);
                if let Err(rollback_err) = tx.rollback().await {
                    error!("Failed to rollback transaction: {}", rollback_err);
                }
                return Err(AiServiceError::Database(e));
            }
        };

        // Now delete the integration
        let result = match sqlx::query!(r#"DELETE FROM ai_integrations WHERE id = ?"#, id)
            .execute(&mut *tx)
            .await
        {
            Ok(result) => result,
            Err(e) => {
                error!("Failed to delete integration {}: {}", id, e);
                if let Err(rollback_err) = tx.rollback().await {
                    error!("Failed to rollback transaction: {}", rollback_err);
                }
                return Err(AiServiceError::Database(e));
            }
        };

        // Commit the transaction
        match tx.commit().await {
            Ok(_) => {
                let found = result.rows_affected() > 0;
                if found {
                    // Delete API key from keychain
                    if let Err(e) =
                        keychain::delete_api_key(integration.api_key_id.as_deref().unwrap_or(""))
                    {
                        error!("Failed to delete API key from keychain: {}", e);
                        // Continue despite keychain deletion error
                    }
                    info!("Successfully deleted integration: {}", id);
                } else {
                    info!("Integration not found for deletion: {}", id);
                }
                Ok(found)
            }
            Err(e) => {
                error!(
                    "Failed to commit transaction for deleting integration {}: {}",
                    id, e
                );
                Err(AiServiceError::Database(e))
            }
        }
    }

    /// Retrieves AI models from the database, optionally filtered by integration ID
    ///
    /// # Arguments
    /// * `integration_id` - Optional ID to filter models by a specific integration
    ///
    /// # Returns
    /// * `Ok(Vec<AiModel>)` - The list of AI models
    /// * `Err` - If a database error occurs
    #[instrument(skip(self), fields(integration_id = ?integration_id))]
    pub async fn get_models(
        &self,
        integration_id: Option<&str>,
    ) -> Result<Vec<AiModel>, AiServiceError> {
        match integration_id {
            Some(id) => {
                info!("Fetching AI models for integration ID: {}", id);

                if id.trim().is_empty() {
                    return Err(AiServiceError::InvalidParameter(
                        "Integration ID cannot be empty".to_string(),
                    ));
                }

                let models = sqlx::query_as!(
                    AiModel,
                    r#"
                    SELECT 
                        id, model_id, mynth_model_id, display_name, path, is_custom,
                        capabilities, tags, metadata, max_context_size, 
                        cost_per_input_token, cost_per_output_token, settings,
                        integration_id, updated_at
                    FROM ai_models
                    WHERE integration_id = ?
                    "#,
                    id
                )
                .fetch_all(self.pool.get())
                .await
                .map_err(AiServiceError::Database)?;

                info!(
                    "Successfully fetched {} models for integration {}",
                    models.len(),
                    id
                );
                Ok(models)
            }
            None => {
                info!("Fetching all AI models");

                let models = sqlx::query_as!(
                    AiModel,
                    r#"
                    SELECT 
                        id, model_id, mynth_model_id, display_name, path, is_custom,
                        capabilities, tags, metadata, max_context_size, 
                        cost_per_input_token, cost_per_output_token, settings,
                        integration_id, updated_at
                    FROM ai_models
                    "#
                )
                .fetch_all(self.pool.get())
                .await
                .map_err(AiServiceError::Database)?;

                info!("Successfully fetched {} models", models.len());
                Ok(models)
            }
        }
    }

    /// Updates the API key for an existing AI integration
    ///
    /// # Arguments
    /// * `integration_id` - The ID of the integration to update
    /// * `api_key` - The new API key to set
    ///
    /// # Returns
    /// * `Ok(())` - If the API key was successfully updated
    /// * `Err` - If a validation or database error occurs
    #[instrument(skip(self, api_key), fields(integration_id = %integration_id))]
    pub async fn set_api_key(
        &self,
        integration_id: &str,
        api_key: &str,
    ) -> Result<(), AiServiceError> {
        info!(
            "Attempting to update API key for integration ID: {}",
            integration_id
        );

        // Validate input parameters
        if integration_id.trim().is_empty() {
            return Err(AiServiceError::InvalidParameter(
                "Integration ID cannot be empty".to_string(),
            ));
        }

        // First check if the integration exists
        let integration = match self.get_integration(integration_id).await? {
            Some(integration) => integration,
            None => {
                return Err(AiServiceError::NotFound(format!(
                    "Integration with ID {} not found",
                    integration_id
                )));
            }
        };

        // Generate a new ULID for the API key ID
        let new_api_key_id = Ulid::new().to_string();

        // Store the new API key in the keychain
        if let Err(e) = keychain::store_api_key(&new_api_key_id, api_key) {
            error!("Failed to store API key in keychain: {}", e);
            return Err(AiServiceError::InvalidParameter(format!(
                "Failed to securely store API key: {}",
                e
            )));
        }

        // Delete the old API key from the keychain if it exists
        if let Some(old_api_key_id) = integration.api_key_id {
            if let Err(e) = keychain::delete_api_key(&old_api_key_id) {
                // Log the error but continue with the update
                error!("Failed to delete old API key from keychain: {}", e);
            }
        }

        // Update the integration record with the new API key ID
        match sqlx::query!(
            r#"
            UPDATE ai_integrations
            SET api_key_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
            new_api_key_id,
            integration_id
        )
        .execute(self.pool.get())
        .await
        {
            Ok(result) => {
                if result.rows_affected() == 0 {
                    error!(
                        "No rows affected when updating integration: {}",
                        integration_id
                    );
                    // Try to clean up the keychain entry if the database update fails
                    if let Err(key_err) = keychain::delete_api_key(&new_api_key_id) {
                        error!("Failed to clean up keychain entry: {}", key_err);
                    }
                    return Err(AiServiceError::NotFound(format!(
                        "Integration with ID {} not found",
                        integration_id
                    )));
                }
                info!(
                    "Successfully updated API key for integration: {}",
                    integration_id
                );
                Ok(())
            }
            Err(e) => {
                error!(
                    "Failed to update API key for integration {}: {}",
                    integration_id, e
                );
                // Try to clean up the keychain entry if the database update fails
                if let Err(key_err) = keychain::delete_api_key(&new_api_key_id) {
                    error!("Failed to clean up keychain entry: {}", key_err);
                }
                Err(AiServiceError::Database(e))
            }
        }
    }

    /// Fetch a single AiModel by its primary key id
    pub async fn get_model_by_id(&self, id: &str) -> Result<Option<AiModel>, AiServiceError> {
        let model = sqlx::query_as!(
            AiModel,
            r#"
            SELECT 
                id, model_id, mynth_model_id, display_name, path, is_custom,
                capabilities, tags, metadata, max_context_size, 
                cost_per_input_token, cost_per_output_token, settings,
                integration_id, updated_at
            FROM ai_models
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(self.pool.get())
        .await
        .map_err(AiServiceError::Database)?;
        Ok(model)
    }
}

// NOTE: This service has been updated to use the new error handling pattern with AiServiceError.
// When updating other services, follow the same pattern:
//
// 1. Define a custom error enum (e.g., ChatServiceError) with variants for different error types
// 2. Change return types from Result<T, sqlx::Error> to Result<T, YourServiceError>
// 3. Add input validation where applicable using the InvalidParameter error variant
// 4. Use match statements for database operations with proper error handling
// 5. Add tracing and instrumentation with the #[instrument] attribute
//
// This provides several benefits:
// - More descriptive errors for clients
// - Input validation at the service layer
// - Better logging and observability
// - Easier debugging when issues occur
