use crate::models::chat::{ChatFolder, UpdateFolderParams};
use crate::AppState;
use tracing::info;

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

#[tauri::command]
pub async fn get_chat_folders(
    state: tauri::State<'_, AppState>,
    workspace_id: String,
    parent_id: Option<String>,
) -> Result<Vec<ChatFolder>, String> {
    state
        .db
        .folders
        .get_chat_folders(workspace_id, parent_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_chat_folder(
    state: tauri::State<'_, AppState>,
    folder_id: String,
) -> Result<(), String> {
    info!("Command: delete_chat_folder with ID: {}", folder_id);

    state
        .db
        .folders
        .delete_folder(folder_id)
        .await
        .map_err(|e| e.to_string())
}
