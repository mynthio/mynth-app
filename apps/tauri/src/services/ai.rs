use std::collections::HashMap;
use std::sync::Arc;
use tracing::{debug, error, info, instrument};
use uuid::Uuid;

use super::database::DbPool;
use crate::models::ai::{
    AiIntegrationWithModels, AiModel, CreateAiIntegrationParams, CreateAiModelParams,
};

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

    /// Creates a new AI integration in the database
    ///
    /// # Arguments
    /// * `params` - Parameters for the new integration
    ///
    /// # Returns
    /// * `Ok(String)` - The ID of the newly created integration
    /// * `Err` - If a database error occurs
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

        let id = format!("ai-{}", Uuid::new_v4());
        info!("Creating AI integration with ID: {}", id);

        // Try to execute the query, with improved error handling
        match sqlx::query!(
            r#"
            INSERT INTO ai_integrations (id, name, base_host, base_path, api_key)
            VALUES (?, ?, ?, ?, ?)
            "#,
            id,
            params.name,
            params.base_host,
            params.base_path,
            params.api_key
        )
        .execute(self.pool.get())
        .await
        {
            Ok(_) => {
                info!("Successfully created AI integration: {}", id);
                Ok(id)
            }
            Err(e) => {
                error!("Failed to create AI integration: {}", e);
                Err(AiServiceError::Database(e))
            }
        }
    }

    /// Creates a new AI model and associates it with an integration
    ///
    /// # Arguments
    /// * `params` - Parameters for the new model
    ///
    /// # Returns
    /// * `Ok(String)` - The ID of the newly created model
    /// * `Err` - If a database error occurs
    #[instrument(skip(self, params), fields(integration_id = %params.integration_id))]
    pub async fn create_model(
        &self,
        params: CreateAiModelParams,
    ) -> Result<String, AiServiceError> {
        // Validate input parameters
        if params.model_id.trim().is_empty() {
            return Err(AiServiceError::InvalidParameter(
                "Model ID cannot be empty".to_string(),
            ));
        }

        let id = format!("model-{}", Uuid::new_v4());
        info!("Creating AI model with ID: {}", id);

        // Try to execute the query, with improved error handling
        match sqlx::query!(
            r#"
            INSERT INTO ai_models (id, model_id, mynth_model_id, integration_id)
            VALUES (?, ?, ?, ?)
            "#,
            id,
            params.model_id,
            params.mynth_model_id,
            params.integration_id,
        )
        .execute(self.pool.get())
        .await
        {
            Ok(_) => {
                info!("Successfully created AI model: {}", id);
                Ok(id)
            }
            Err(e) => {
                error!("Failed to create AI model: {}", e);
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
                i.id, i.name, i.base_host, i.base_path, i.api_key,
                m.id as model_id_pk, m.model_id, m.mynth_model_id, m.integration_id
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
                        base_host: row.base_host,
                        base_path: row.base_path,
                        api_key: row.api_key,
                        models: Vec::new(),
                    });

            if let Some(model_id_pk) = row.model_id_pk {
                integration.models.push(AiModel {
                    id: model_id_pk,
                    model_id: row.model_id.unwrap(),
                    mynth_model_id: row.mynth_model_id,
                    integration_id: row.integration_id.unwrap(),
                });
            }
        }

        Ok(integrations_map.into_values().collect())
    }

    #[instrument(skip(self), fields(integration_id = %id))]
    pub async fn get_integration(
        &self,
        id: &str,
    ) -> Result<Option<AiIntegrationWithModels>, AiServiceError> {
        info!("Fetching AI integration with ID: {}", id);

        if id.trim().is_empty() {
            return Err(AiServiceError::InvalidParameter(
                "Integration ID cannot be empty".to_string(),
            ));
        }

        let rows = match sqlx::query!(
            r#"
        SELECT 
            i.id, i.name, i.base_host, i.base_path, i.api_key,
            m.id as "model_id_pk?", m.model_id as "model_id?",
            m.mynth_model_id as "mynth_model_id?", m.integration_id as "integration_id?"
        FROM ai_integrations i
        LEFT JOIN ai_models m ON m.integration_id = i.id
        WHERE i.id = ?
        "#,
            id
        )
        .fetch_all(self.pool.get())
        .await
        {
            Ok(rows) => rows,
            Err(e) => {
                error!("Failed to fetch AI integration {}: {}", id, e);
                return Err(AiServiceError::Database(e));
            }
        };

        if rows.is_empty() {
            debug!("No integration found with ID: {}", id);
            return Ok(None);
        }

        let first_row = &rows[0];
        let mut integration = AiIntegrationWithModels {
            id: first_row.id.clone(),
            name: first_row.name.clone(),
            base_host: first_row.base_host.clone(),
            base_path: first_row.base_path.clone(),
            api_key: first_row.api_key.clone(),
            models: Vec::new(),
        };

        for row in &rows {
            if let (Some(model_id_pk), Some(model_id), Some(integration_id)) =
                (&row.model_id_pk, &row.model_id, &row.integration_id)
            {
                integration.models.push(AiModel {
                    id: model_id_pk.clone(),
                    model_id: model_id.clone(),
                    mynth_model_id: row.mynth_model_id.clone(),
                    integration_id: integration_id.clone(),
                });
            }
        }

        info!(
            "Successfully fetched integration {} with {} models",
            id,
            integration.models.len()
        );
        Ok(Some(integration))
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
