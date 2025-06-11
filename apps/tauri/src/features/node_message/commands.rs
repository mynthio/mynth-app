use tauri::State;

use crate::{
    features::node_message::{
        dtos::NodeMessage, repository::NodeMessageRepository, service::NodeMessageService,
    },
    AppState,
};

#[tauri::command]
pub async fn get_all_node_messages_by_node_id<'a>(
    state: State<'a, AppState>,
    node_id: String,
) -> Result<Vec<NodeMessage>, String> {
    let repository = NodeMessageRepository::new(state.db_pool.clone());

    repository
        .get_all_by_node_id(&node_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_node_messages_by_node_id_formatted<'a>(
    state: State<'a, AppState>,
    node_id: String,
) -> Result<Vec<NodeMessage>, String> {
    let repository = NodeMessageRepository::new(state.db_pool.clone());

    let node_messages = repository
        .get_all_by_node_id(&node_id)
        .await
        .map_err(|e| e.to_string());

    NodeMessageService::format(node_messages.unwrap())
        .await
        .map_err(|e| e.to_string())
}
