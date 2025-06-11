use tauri::State;

use crate::AppState;

use super::dtos::McpServer;
use super::repository::McpServerRepository;

#[tauri::command]
pub async fn find_all_mcp_servers<'a>(
    state: State<'a, AppState>,
) -> Result<Vec<McpServer>, String> {
    let repository = McpServerRepository::new(state.db_pool.clone());

    repository.find_all().await.map_err(|e| e.to_string())
}
