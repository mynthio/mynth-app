use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[ts(export, export_to = "./model/model.type.ts")]
pub struct Model {
    // ID
    pub id: String,
    // Marketplace ID
    pub marketplace_id: Option<String>,
    // Provider ID
    pub provider_id: Option<String>,
    // Name
    pub name: String,
    // Display Name
    pub display_name: Option<String>,
    // Max Input Tokens
    pub max_input_tokens: Option<i64>,
    // Input Price
    pub input_price: Option<f64>,
    // Output Price
    pub output_price: Option<f64>,
    // Tags
    pub tags: Option<String>,
    // Source
    pub source: String,
    // Is Hidden
    pub is_hidden: bool,
    // Is Favourite
    pub is_favourite: bool,
    // Capabilities
    pub capabilities: Option<String>,
    // Is pinned
    pub is_pinned: bool,
    // Request template
    pub request_template: Option<String>,
    // JSON Config
    pub json_config: Option<String>,
    // JSON Metadata V1
    pub json_metadata_v1: Option<String>,
    // JSON Variables
    pub json_variables: Option<String>,
    // Updated At
    #[ts(type = "string")]
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewModel {
    pub id: Option<String>,
    pub marketplace_id: Option<String>,
    pub name: String,
    pub display_name: Option<String>,
    pub max_input_tokens: Option<i64>,
    pub input_price: Option<f64>,
    pub output_price: Option<f64>,
    pub tags: Option<String>,
    pub source: String,
    pub is_hidden: bool,
    pub request_template: Option<String>,
    pub json_config: Option<String>,
    pub json_metadata_v1: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./model/update-model.type.ts")]
pub struct UpdateModelPublic {
    pub id: String,
    #[ts(optional)]
    pub display_name: Option<String>,
    #[ts(optional)]
    pub is_pinned: Option<bool>,
    #[ts(optional)]
    pub is_favourite: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpdateModel {
    pub id: String,
    pub marketplace_id: Option<String>,
    pub provider_id: Option<String>,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub max_input_tokens: Option<i64>,
    pub input_price: Option<f64>,
    pub output_price: Option<f64>,
    pub tags: Option<String>,
    pub source: Option<String>,
    pub is_hidden: Option<bool>,
    pub is_favourite: Option<bool>,
    pub capabilities: Option<String>,
    pub is_pinned: Option<bool>,
    pub request_template: Option<String>,
    pub json_config: Option<String>,
    pub json_metadata_v1: Option<String>,
    pub json_variables: Option<String>,
}
