use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatFolder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatListItem {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: Option<String>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum FlatItem {
    #[serde(rename = "folder")]
    Folder(ChatFolder),
    #[serde(rename = "chat")]
    Chat(ChatListItem),
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatParams {
    pub name: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFolderParams {
    pub name: Option<String>,
    pub parent_id: Option<String>,
}
