use crate::AppState;

#[tauri::command]
pub async fn update_chat_folder_name(
    state: tauri::State<'_, AppState>,
    folder_id: i64,
    new_name: String,
) -> Result<(), String> {
    state
        .db
        .folders
        .update_name(folder_id, new_name)
        .await
        .map_err(|e| e.to_string())
}
