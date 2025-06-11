use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

use crate::features::workspace::dtos::WorkspaceItemContextInheritanceMode;

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./branch/branch.type.ts")]
pub struct Branch {
    // ID
    pub id: String,
    // Name
    pub name: Option<String>,
    // Chat ID
    pub chat_id: String,
    // Parent ID
    pub parent_id: Option<String>,
    // Model ID
    pub model_id: Option<String>,
    // Updated At
    #[ts(type = "string")]
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NewBranch {
    // ID
    pub id: Option<String>,
    // Name
    pub name: String,
    // Chat ID
    pub chat_id: String,
    // Parent ID
    pub parent_id: Option<String>,
    // Model ID
    pub model_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS, Default)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./branch/branch.type.ts")]
pub struct UpdateBranch {
    pub id: String,
    // Name
    pub name: Option<String>,
    // Model ID
    pub model_id: Option<String>,
}
