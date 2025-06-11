use std::sync::Arc;

use anyhow::{Error, Result};
use sqlx::SqlitePool;
use tracing::debug;

use super::dtos::InitialCtx;

pub struct AiGenerationRepository {
    pool: Arc<SqlitePool>,
}

impl AiGenerationRepository {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get_initial_ctx(&self, branch_id: &str) -> Result<InitialCtx, Error> {
        debug!(branch_id = branch_id, "get_initial_ctx");

        let endpoint_type = "chat_stream";
        let ctx = sqlx::query_as!(
            InitialCtx,
            "
              SELECT
                branches.id as branch_id,
                chats.id as chat_id,
                chats.context as chat_context,
                chats.context_inheritance_mode as chat_context_inheritance_mode,
                models.id as model_id,
                models.name as model_name,
                models.max_input_tokens as model_max_input_tokens,
                models.request_template as model_request_template,
                providers.id as provider_id,
                providers.base_url as provider_base_url,
                provider_endpoints.id as endpoint_id,
                provider_endpoints.path as endpoint_path,
                provider_endpoints.method as endpoint_method,
                provider_endpoints.compatibility as endpoint_compatibility,
                provider_endpoints.request_template as endpoint_request_template,
                provider_endpoints.json_request_schema as endpoint_request_schema,
                provider_endpoints.json_response_schema as endpoint_response_schema,
                provider_endpoints.json_request_config as endpoint_request_config,
                provider_endpoints.json_response_config as endpoint_response_config,
                provider_endpoints.streaming as endpoint_streaming
              FROM branches
              LEFT JOIN chats
                ON branches.chat_id = chats.id
              LEFT JOIN models
                ON branches.model_id = models.id
              LEFT JOIN model_endpoint_configurations AS mec
                ON models.id = mec.model_id
              LEFT JOIN provider_endpoints
                ON mec.endpoint_id = provider_endpoints.id
                   AND provider_endpoints.type = ?
              LEFT JOIN providers
                ON provider_endpoints.provider_id = providers.id
              WHERE branches.id = ?",
            endpoint_type,
            branch_id
        )
        .fetch_one(&*self.pool)
        .await?;

        debug!("get_initial_ctx: {:?}", ctx);

        Ok(ctx)
    }
}
