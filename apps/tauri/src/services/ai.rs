use std::collections::HashMap;
use std::sync::Arc;
use tracing::{debug, error, info, instrument};
use ulid::Ulid;

use super::database::DbPool;
use crate::models::ai::{
    AiIntegration, AiIntegrationWithModels, AiModel, CreateAiIntegrationParams, CreateAiModelInput,
};
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

        // Generate a ULID for keychain reference and store actual API key in keychain
        let api_key_id = Ulid::new().to_string();
        if let Err(e) =
            keychain::store_api_key(&api_key_id, params.api_key.as_deref().unwrap_or(""))
        {
            error!("Failed to store API key in keychain: {}", e);
            return Err(AiServiceError::InvalidParameter(format!(
                "Failed to securely store API key: {}",
                e
            )));
        }

        let mut tx = match self.pool.get().begin().await {
            Ok(tx) => tx,
            Err(e) => {
                error!("Failed to begin transaction: {}", e);
                return Err(AiServiceError::Database(e));
            }
        };

        // Insert the integration with api_key_id instead of actual API key
        match sqlx::query!(
            r#"
            INSERT INTO ai_integrations (id, name, host, path, api_key_id, is_enabled, origin, updated_at)
            VALUES (?, ?, ?, ?, ?, true, 'user', CURRENT_TIMESTAMP)
            "#,
            integration_id,
            params.name,
            params.base_host,
            params.base_path,
            api_key_id
        )
        .execute(&mut *tx)
        .await
        {
            Ok(_) => {
                info!("Successfully inserted integration record: {}", integration_id);
            }
            Err(e) => {
                error!("Failed to insert integration record {}: {}", integration_id, e);
                // Clean up keychain entry if database insert fails
                if let Err(key_err) = keychain::delete_api_key(&api_key_id) {
                    error!("Failed to clean up keychain entry: {}", key_err);
                }
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

                match sqlx::query!(
                    r#"
                    INSERT INTO ai_models (id, model_id, mynth_model_id, origin, capabilities, tags, integration_id, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    "#,
                    model_pk_id, // Use the generated ULID for the primary key
                    model_input.model_id,
                    model_input.mynth_model_id,
                    model_input.origin,
                    model_input.capabilities,
                    model_input.tags,
                    integration_id, // Link to the integration created above
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

    #[instrument(skip(self))]
    pub async fn get_integrations_with_models(
        &self,
    ) -> Result<Vec<AiIntegrationWithModels>, AiServiceError> {
        info!("Fetching all AI integrations with models");

        let rows = match sqlx::query!(
            r#"
            SELECT 
                i.id, i.name, i.host, i.path, i.api_key_id,
                i.is_enabled, i.origin, i.marketplace_integration_id,
                i.mynth_id, i.settings,
                i.updated_at,
                m.id as model_id_pk, m.model_id, m.mynth_model_id, 
                m.origin as model_origin, m.capabilities, m.tags,
                m.notes, m.context_size, m.cost_per_input_token, m.cost_per_output_token,
                m.integration_id, m.updated_at as model_updated_at
            FROM ai_integrations i
            LEFT JOIN ai_models m ON m.integration_id = i.id
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

        debug!("rows: {:?}", rows);

        let mut integrations_map: HashMap<String, AiIntegrationWithModels> = HashMap::new();

        for row in rows {
            let integration =
                integrations_map
                    .entry(row.id.clone())
                    .or_insert_with(|| AiIntegrationWithModels {
                        id: row.id,
                        name: row.name,
                        host: row.host,
                        path: row.path,
                        api_key_id: row.api_key_id,
                        is_enabled: row.is_enabled,
                        origin: row.origin,
                        marketplace_integration_id: row.marketplace_integration_id,
                        mynth_id: row.mynth_id,
                        settings: row.settings,
                        updated_at: row.updated_at,
                        models: Vec::new(),
                    });

            if let Some(model_id_pk) = row.model_id_pk {
                integration.models.push(AiModel {
                    id: model_id_pk,
                    model_id: row.model_id.unwrap(),
                    mynth_model_id: row.mynth_model_id,
                    origin: row.model_origin.unwrap_or_else(|| "unknown".to_string()),
                    capabilities: row.capabilities,
                    tags: row.tags,
                    notes: row.notes,
                    context_size: row.context_size,
                    cost_per_input_token: row.cost_per_input_token,
                    cost_per_output_token: row.cost_per_output_token,
                    integration_id: row.integration_id.unwrap(),
                    updated_at: row.model_updated_at,
                });
            }
        }

        Ok(integrations_map.into_values().collect())
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
                id, name, host, path, api_key_id,
                is_enabled, origin, marketplace_integration_id,
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
                id, name, host, path, api_key_id,
                is_enabled, origin, marketplace_integration_id,
                mynth_id, settings,
                updated_at
            FROM ai_integrations
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
                        id, model_id, mynth_model_id, origin,
                        capabilities, tags, notes, context_size, 
                        cost_per_input_token, cost_per_output_token,
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
                        id, model_id, mynth_model_id, origin,
                        capabilities, tags, notes, context_size, 
                        cost_per_input_token, cost_per_output_token,
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
