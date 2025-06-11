use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone, PartialEq)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[ts(export, export_to = "./provider/provider-compatibility.type.ts")]
pub enum ProviderEndpointCompatibility {
    None,
    OpenAI,
}

impl From<String> for ProviderEndpointCompatibility {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider compatibility: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum ProviderEndpointType {
    HealthCheck,
    Models,
    Chat,
}

impl From<String> for ProviderEndpointType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider endpoint type: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type)]
#[strum(serialize_all = "UPPERCASE")]
#[sqlx(rename_all = "UPPERCASE")]
pub enum ProviderEndpointMethod {
    Get,
    Post,
}

impl From<String> for ProviderEndpointMethod {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider endpoint method: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProviderEndpoint {
    pub id: String,
    pub provider_id: String,
    pub marketplace_id: Option<String>,
    pub r#type: ProviderEndpointType,
    pub display_name: Option<String>,
    pub path: String,
    pub method: ProviderEndpointMethod,
    pub compatibility: ProviderEndpointCompatibility,
    pub request_template: Option<String>,
    pub json_request_schema: Option<String>,
    pub json_response_schema: Option<String>,
    pub json_request_config: Option<String>,
    pub json_response_config: Option<String>,
    pub json_variables: Option<String>,
    pub streaming: bool,
    pub priority: Option<i64>,
    pub json_config: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewProviderEndpoint {
    pub id: Option<String>,
    pub provider_id: String,
    pub marketplace_id: Option<String>,
    pub r#type: ProviderEndpointType,
    pub display_name: Option<String>,
    pub path: String,
    pub method: ProviderEndpointMethod,
    pub compatibility: ProviderEndpointCompatibility,
    pub request_template: Option<String>,
    pub json_request_schema: Option<String>,
    pub json_response_schema: Option<String>,
    pub json_request_config: Option<String>,
    pub json_response_config: Option<String>,
    pub streaming: bool,
    pub priority: Option<i64>,
    pub json_config: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderEndpointMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderEndpointCallChatData {
    pub provider_model_name: String,
    pub messages: Vec<ProviderEndpointMessage>,
}
