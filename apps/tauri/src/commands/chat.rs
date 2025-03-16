use crate::models::chat::{Chat, ChatListItem, UpdateChatParams};
use crate::AppState;
use tracing::info;

#[tauri::command]
pub async fn get_chats(
    state: tauri::State<'_, AppState>,
    workspace_id: String,
    parent_id: Option<String>,
) -> Result<Vec<ChatListItem>, String> {
    info!(
        "Command: get_chats with workspace ID: {} and parent ID: {:?}",
        workspace_id, parent_id
    );

    state
        .db
        .chats
        .get_chats(workspace_id, parent_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_chat(
    state: tauri::State<'_, AppState>,
    chat_id: String,
) -> Result<Option<Chat>, String> {
    info!("Command: get_chat with ID: {}", chat_id);

    state
        .db
        .chats
        .get_chat(&chat_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_chat(
    state: tauri::State<'_, AppState>,
    chat_id: String,
    params: UpdateChatParams,
) -> Result<(), String> {
    info!("Command: update_chat with ID: {}", chat_id);

    state
        .db
        .chats
        .update_chat(&chat_id, params)
        .await
        .map_err(|e| e.to_string())
}
