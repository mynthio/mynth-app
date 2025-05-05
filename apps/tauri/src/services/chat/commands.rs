use super::dtos::Chat;
use super::service::ChatService;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_all_chats<'a>(
    state: State<'a, AppState>,
    workspace_id: String,
) -> Result<Vec<Chat>, String> {
    let service = ChatService::new(state.db_pool.clone());
    service
        .get_all(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}
