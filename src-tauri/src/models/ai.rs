use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegration {
    pub id: String,
    pub name: String,
    pub base_host: String,
    pub base_path: String,
    pub api_key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AiModel {
    pub id: String,
    pub model_id: String,
    pub mynth_model_id: Option<String>,
    pub integration_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiIntegrationWithModels {
    pub id: String,
    pub name: String,
    pub base_host: String,
    pub base_path: String,
    pub api_key: Option<String>,
    pub models: Vec<AiModel>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiIntegrationParams {
    pub name: String,
    pub base_host: String,
    pub base_path: String,
    pub api_key: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiModelParams {
    pub model_id: String,
    pub mynth_model_id: Option<String>,
    pub integration_id: String,
}
