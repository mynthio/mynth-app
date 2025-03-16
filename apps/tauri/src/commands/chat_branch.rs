use crate::models::chat::ChatNodesResponse;
use crate::models::chat_branch::Branch;
use crate::AppState;
use tracing::info;

/// Fetch a chat branch by its ID
///
/// This command retrieves a single branch with all its data based on the provided branch_id.
/// If the branch doesn't exist, it will return None.
///
/// @param branch_id - The ID of the branch to fetch (required)
/// @returns The branch object if found, or None if not found
#[tauri::command]
pub async fn get_chat_branch(
    state: tauri::State<'_, AppState>,
    branch_id: String,
) -> Result<Option<Branch>, String> {
    info!("Command: get_chat_branch with ID: {}", branch_id);

    state
        .db
        .chat_branch
        .get_branch(&branch_id)
        .await
        .map_err(|e| e.to_string())
}

/// Fetch all branches for a specific chat
///
/// This command retrieves all branches for a given chat_id.
/// Results are ordered by created_at (newest first).
///
/// @param chat_id - The ID of the chat to fetch branches for (required)
/// @returns A vector of Branch objects
#[tauri::command]
pub async fn get_chat_branches(
    state: tauri::State<'_, AppState>,
    chat_id: String,
) -> Result<Vec<Branch>, String> {
    info!("Command: get_chat_branches with chat ID: {}", chat_id);

    state
        .db
        .chat_branch
        .get_branches(&chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// Fetch chat nodes for a specific branch with pagination
///
/// This command retrieves chat nodes for a branch with cursor-based pagination.
/// - branch_id is required and specifies the branch to fetch nodes from
/// - after_node_id is optional and enables cursor-based pagination
///
/// Results are limited to 20 nodes per request and sorted by created_at (newest first).
/// Each node includes its active content version with the actual message/note content.
///
/// @param branch_id - The ID of the branch to fetch nodes for (required)
/// @param after_node_id - Optional cursor for pagination (fetches nodes created after this node)
/// @returns A ChatNodesResponse containing the nodes and a flag indicating if more results exist
#[tauri::command]
pub async fn get_chat_branch_nodes(
    state: tauri::State<'_, AppState>,
    branch_id: String,
    after_node_id: Option<String>,
) -> Result<ChatNodesResponse, String> {
    info!(
        "Command: get_chat_branch_nodes with branch ID: {}, after node ID: {:?}",
        branch_id, after_node_id
    );

    state
        .db
        .chat_branch
        .get_chat_nodes(&branch_id, after_node_id.as_deref())
        .await
        .map_err(|e| e.to_string())
}
