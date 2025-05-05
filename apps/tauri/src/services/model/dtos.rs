use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Model {
    pub id: String,
    pub provider_id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub max_input_tokens: Option<i64>,
    pub input_price: Option<f64>,
    pub output_price: Option<f64>,
    pub tags: Option<String>,
    pub source: String,
    pub is_hidden: bool,
    pub json_config: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
}
