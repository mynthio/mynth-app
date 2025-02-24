use sqlx::Pool;
use sqlx::Sqlite;
use std::collections::HashMap;
use tracing::debug;
use tracing::info;
use uuid::Uuid;

use crate::models::ai::{
    AiIntegrationWithModels, AiModel, CreateAiIntegrationParams, CreateAiModelParams,
};

pub struct AiService {
    pool: Pool<Sqlite>,
}

impl AiService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create_integration(
        &self,
        params: CreateAiIntegrationParams,
    ) -> Result<String, sqlx::Error> {
        let id = format!("ai-{}", Uuid::new_v4());
        sqlx::query!(
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
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn create_model(&self, params: CreateAiModelParams) -> Result<String, sqlx::Error> {
        let id = format!("model-{}", Uuid::new_v4());
        sqlx::query!(
            r#"
            INSERT INTO ai_models (id, model_id, mynth_model_id, integration_id)
            VALUES (?, ?, ?, ?)
            "#,
            id,
            params.model_id,
            params.mynth_model_id,
            params.integration_id,
        )
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn fetch_integrations_with_models(
        &self,
    ) -> Result<Vec<AiIntegrationWithModels>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                i.id, i.name, i.base_host, i.base_path, i.api_key,
                m.id as model_id_pk, m.model_id, m.mynth_model_id, m.integration_id
            FROM ai_integrations i
            LEFT JOIN ai_models m ON m.integration_id = i.id
            "#
        )
        .fetch_all(&self.pool)
        .await?;

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

    pub async fn get_integration(
        &self,
        id: &str,
    ) -> Result<Option<AiIntegrationWithModels>, sqlx::Error> {
        let rows = sqlx::query!(
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
        .fetch_all(&self.pool)
        .await?;

        if rows.is_empty() {
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

        Ok(Some(integration))
    }
}
