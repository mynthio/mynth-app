use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegration {
    pub id: String,
    pub mynth_id: Option<String>,
    pub name: String,
    pub host: String,
    pub path: Option<String>,
    pub api_key_id: Option<String>,
    pub is_enabled: bool,
    pub origin: String,
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
    pub origin: String,
    pub capabilities: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
    pub context_size: Option<i64>,
    pub cost_per_input_token: Option<f64>,
    pub cost_per_output_token: Option<f64>,
    pub integration_id: String,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegrations(pub Vec<AiIntegration>);

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegrationWithModels {
    pub id: String,
    pub mynth_id: Option<String>,
    pub name: String,
    pub host: String,
    pub path: Option<String>,
    pub api_key_id: Option<String>,
    pub is_enabled: bool,
    pub origin: String,
    pub marketplace_integration_id: Option<String>,
    pub settings: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
    pub models: Vec<AiModel>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiIntegrationParams {
    pub name: String,
    pub base_host: String,
    pub base_path: String,
    pub api_key: Option<String>,
    pub models: Option<Vec<CreateAiModelInput>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiModelInput {
    pub model_id: String,
    pub mynth_model_id: Option<String>,
    pub origin: String,
    pub capabilities: Option<String>,
    pub tags: Option<String>,
}
