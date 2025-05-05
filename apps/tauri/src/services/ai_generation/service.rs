use std::sync::Arc;

use anyhow::Error;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tracing::debug;

use crate::services::{
    provider::dtos::ProviderCompatibility, provider_endpoint::dtos::ProviderEndpointType,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct InitialCtx {
    // CHAT
    pub chat_id: String,
    // BRANCH
    pub branch_id: String,
    // MODEL
    pub model_id: String,
    pub model_name: String,
    pub model_max_input_tokens: Option<i64>,
    // PROVIDER
    pub provider_id: String,
    pub provider_base_url: String,
    pub provider_compatibility: ProviderCompatibility,
    // ENDPOINT
    pub endpoint_id: String,
    pub endpoint_path: String,
    pub endpoint_method: String,
    pub endpoint_request_schema: Option<String>,
    pub endpoint_response_schema: Option<String>,
    pub endpoint_request_config: Option<String>,
    pub endpoint_response_config: Option<String>,
    pub endpoint_streaming: bool,
}

pub struct AiGenerationService {
    pool: Arc<SqlitePool>,
}

impl AiGenerationService {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get_initial_ctx(&self, branch_id: &str) -> Result<InitialCtx, Error> {
        debug!(branch_id = branch_id, "get_initial_ctx");

        let endpoint_type = ProviderEndpointType::Chat.to_string();
        let ctx = sqlx::query_as!(
            InitialCtx,
            "
              SELECT 
                branches.id as branch_id,
                chats.id as chat_id,
                models.id as model_id,
                models.name as model_name,
                models.max_input_tokens as model_max_input_tokens,
                providers.id as provider_id,
                providers.base_url as provider_base_url,
                providers.compatibility as provider_compatibility,
                provider_endpoints.id as endpoint_id,
                provider_endpoints.path as endpoint_path,
                provider_endpoints.method as endpoint_method,
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
              LEFT JOIN providers
                ON models.provider_id = providers.id
              LEFT JOIN provider_endpoints
                ON providers.id = provider_endpoints.provider_id AND provider_endpoints.type = ?
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
