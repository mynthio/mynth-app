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

/// Delete a chat and all its associated data
///
/// This command deletes a chat and all its related data including:
/// - Chat branches
/// - Chat nodes
/// - Chat node content versions
///
/// @param chat_id - The ID of the chat to delete (required)
/// @returns () on success, or an error message on failure
#[tauri::command]
pub async fn delete_chat(state: tauri::State<'_, AppState>, chat_id: String) -> Result<(), String> {
    info!("Command: delete_chat with ID: {}", chat_id);

    state
        .db
        .chats
        .delete_chat(&chat_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_chat(
    state: tauri::State<'_, crate::AppState>,
    name: String,
    workspace_id: String,
    parent_id: Option<String>,
) -> Result<String, String> {
    state
        .db
        .chats
        .create(&name, &workspace_id, parent_id.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn switch_active_message_version(
    state: tauri::State<'_, crate::AppState>,
    node_id: String,
    version_number: i64,
) -> Result<Option<crate::models::chat::ContentVersion>, String> {
    state
        .db
        .chat_node
        .switch_active_message_version(node_id, version_number)
        .await
        .map_err(|e| format!("Failed to switch active message version: {}", e))
}
