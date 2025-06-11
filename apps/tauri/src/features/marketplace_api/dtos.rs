use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all(serialize = "camelCase", deserialize = "camelCase"))]
#[ts(
    export,
    export_to = "./marketplace-api/marketplace-provider-item.type.ts"
)]
pub struct MarketplaceApiProvider {
    // ID
    pub id: String,
    // Is Official
    pub is_official: bool,
    // Base URL
    pub base_url: String,
    // Compatibility
    pub compatibility: String,
    // Auth Type
    pub auth_type: String,
    // Auth Config
    pub auth_config: String,
    // Models Sync Strategy
    pub models_sync_strategy: String,
    // Updated At
    pub updated_at: String,
    // Created At
    pub created_at: String,
    // Published At
    pub published_at: String,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all(serialize = "camelCase", deserialize = "camelCase"))]
#[ts(
    export,
    export_to = "./marketplace-api/marketplace-provider-item.type.ts"
)]
pub struct MarketplaceApiProviderModel {
    // ID
    pub id: String,
    // Name
    pub name: String,
    // Display Name
    pub display_name: String,
    // Max Input Tokens
    pub max_input_tokens: Option<u32>,
    // Input Price
    pub input_price: Option<f64>,
    // Output Price
    pub output_price: Option<f64>,
    // Tags
    pub tags: Option<Vec<String>>,
    // Request template
    pub request_template: Option<String>,
    // JSON Config
    pub json_config: Option<String>,
    // JSON Metadata V1
    pub json_metadata_v1: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all(serialize = "camelCase", deserialize = "camelCase"))]
#[ts(
    export,
    export_to = "./marketplace-api/marketplace-provider-item.type.ts"
)]
pub struct MarketplaceApiProviderEndpoint {
    // ID
    pub id: String,
    // Display Name
    pub display_name: Option<String>,
    // Type
    pub r#type: String,
    // Path
    pub path: String,
    // Method
    pub method: String,
    // Request template
    pub request_template: Option<String>,
    // JSON Request Schema
    pub json_request_schema: Option<String>,
    // JSON Response Schema
    pub json_response_schema: Option<String>,
    // Streaming
    pub streaming: bool,
    // Priority
    pub priority: Option<u32>,
    // JSON Config
    pub json_config: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "camelCase"))]
pub struct MarketplaceApiProviderIntegration {
    pub provider: MarketplaceApiProvider,
    pub provider_endpoints: Vec<MarketplaceApiProviderEndpoint>,
    pub models: Vec<MarketplaceApiProviderModel>,
}
