use tauri::State;

use crate::{
    features::node::dtos::{UpdateNode, UpdateNodePublic},
    AppState,
};

use super::{dtos::Node, repository::NodeRepository, service::NodeService};

#[tauri::command]
pub async fn get_all_nodes_by_branch_id<'a>(
    state: State<'a, AppState>,
    branch_id: String,
) -> Result<Vec<Node>, String> {
    let repository = NodeRepository::new(state.db_pool.clone());

    repository
        .get_all_by_branch_id(&branch_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_nodes_by_branch_id_formatted<'a>(
    state: State<'a, AppState>,
    branch_id: String,
) -> Result<Vec<Node>, String> {
    let repository = NodeRepository::new(state.db_pool.clone());

    let nodes = repository.get_all_by_branch_id(&branch_id).await.unwrap();

    NodeService::format_nodes(nodes)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_node<'a>(
    state: State<'a, AppState>,
    payload: UpdateNodePublic,
) -> Result<(), String> {
    let repository = NodeRepository::new(state.db_pool.clone());

    repository
        .update(UpdateNode::from(payload))
        .await
        .map_err(|e| e.to_string())
}
