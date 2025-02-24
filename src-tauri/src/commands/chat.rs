use crate::models::chat::{ChatListItem, FlatItem, UpdateChatParams};
use crate::AppState;

#[tauri::command]
pub async fn fetch_chats(
    state: tauri::State<'_, AppState>,
    workspace_id: Option<String>,
) -> Result<Vec<ChatListItem>, String> {
    state
        .db
        .chats
        .fetch_chats(workspace_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_flat_structure(
    state: tauri::State<'_, AppState>,
    workspace_id: Option<String>,
) -> Result<Vec<FlatItem>, String> {
    state
        .db
        .chats
        .fetch_flat_structure(workspace_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_chat(
    state: tauri::State<'_, AppState>,
    chat_id: String,
    params: UpdateChatParams,
) -> Result<(), String> {
    state
        .db
        .chats
        .update_chat(&chat_id, params)
        .await
        .map_err(|e| e.to_string())
}
