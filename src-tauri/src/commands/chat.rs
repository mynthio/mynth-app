use crate::models::chat::{ChatFolder, ChatListItem, FlatItem};
use crate::AppState;

#[tauri::command]
pub async fn fetch_chats(state: tauri::State<'_, AppState>) -> Result<Vec<ChatListItem>, String> {
    state.db.fetch_chats().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_folders(state: tauri::State<'_, AppState>) -> Result<Vec<ChatFolder>, String> {
    state
        .db
        .folders
        .fetch_all()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_flat_structure(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<FlatItem>, String> {
    state
        .db
        .fetch_flat_structure()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_chat_name(
    state: tauri::State<'_, AppState>,
    chat_id: String,
    new_name: String,
) -> Result<(), String> {
    state
        .db
        .update_chat_name(&chat_id, new_name)
        .await
        .map_err(|e| e.to_string())
}
