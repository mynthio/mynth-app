use crate::models::chat::ChatListItem;
use crate::AppState;

#[tauri::command]
pub async fn fetch_chats(state: tauri::State<'_, AppState>) -> Result<Vec<ChatListItem>, String> {
    state.db.fetch_chats().await.map_err(|e| e.to_string())
}
