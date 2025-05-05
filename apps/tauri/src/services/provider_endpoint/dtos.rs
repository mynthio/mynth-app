use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};

#[derive(Debug, Serialize, Deserialize, Display, EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum ProviderEndpointType {
    Models,
    Chat,
}

impl From<String> for ProviderEndpointType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider endpoint type: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString)]
#[strum(serialize_all = "snake_case")]
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
    pub r#type: ProviderEndpointType,
    pub display_name: Option<String>,
    pub path: String,
    pub method: ProviderEndpointMethod,
    pub json_request_schema: Option<String>,
    pub json_response_schema: Option<String>,
    pub json_request_config: Option<String>,
    pub json_response_config: Option<String>,
    pub streaming: bool,
    pub priority: Option<i64>,
    pub json_config: Option<String>,
}
