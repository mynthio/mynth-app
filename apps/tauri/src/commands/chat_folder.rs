use crate::models::chat::UpdateFolderParams;
use crate::AppState;

#[tauri::command]
pub async fn update_chat_folder(
    state: tauri::State<'_, AppState>,
    folder_id: String,
    params: UpdateFolderParams,
) -> Result<(), String> {
    state
        .db
        .folders
        .update_folder(folder_id, params)
        .await
        .map_err(|e| e.to_string())
}
