use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegration {
    pub id: String,
    pub mynth_id: Option<String>,
    pub display_name: String,
    pub host: String,
    pub base_path: Option<String>,
    pub chat_completion_path: Option<String>,
    pub api_key_id: Option<String>,
    pub is_enabled: bool,
    pub is_custom: bool,
    pub marketplace_integration_id: Option<String>,
    pub settings: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AiModel {
    pub id: String,
    pub model_id: String,
    pub mynth_model_id: Option<String>,
    pub display_name: Option<String>,
    pub path: Option<String>,
    pub is_custom: bool,
    pub capabilities: Option<String>,
    pub tags: Option<String>,
    pub metadata: Option<String>,
    pub max_context_size: Option<i64>,
    pub cost_per_input_token: Option<f64>,
    pub cost_per_output_token: Option<f64>,
    pub settings: Option<String>,
    pub integration_id: String,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegrations(pub Vec<AiIntegration>);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiIntegrationParams {
    pub name: String,
    pub base_host: String,
    pub base_path: String,
    pub chat_completion_path: String,
    pub models: Option<Vec<CreateAiModelInput>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiModelInput {
    pub model_id: String,
    pub mynth_model_id: Option<String>,
    pub display_name: Option<String>,
    pub path: Option<String>,
    pub capabilities: Option<String>,
    pub tags: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAiIntegrationApiKeyParams {
    pub integration_id: String,
    pub api_key: String,
}
