use super::{
    dtos::RegenerateNodePayload, repository::AiGenerationRepository, service::AiGenerationService,
};
use crate::{
    features::{
        chat_stream_manager::dtos::ChatStreamEventPayload,
        event_sessions::dtos::ChatEventPayload,
        node::{repository::NodeRepository, service::NodeService},
        node_message::repository::NodeMessageRepository,
        provider_endpoint::{
            repository::ProviderEndpointRepository, service::ProviderEndpointService,
        },
        workspace::repository::WorkspaceRepository,
    },
    AppState,
};
use tauri::{ipc::Channel, State};
use tracing::error;

#[tauri::command]
pub async fn generate_text<'a>(
    state: State<'a, AppState>,
    branch_id: String,
    message: String,
    channel: Channel<ChatEventPayload>,
) -> Result<(), String> {
    let repository = AiGenerationRepository::new(state.db_pool.clone());
    let service = AiGenerationService::new(repository, state.db_pool.clone());

    let workspace_repository = WorkspaceRepository::new(state.db_pool.clone());
    let node_repository = NodeRepository::new(state.db_pool.clone());
    let node_service = NodeService::new(node_repository.clone());
    let provider_endpoint_repository = ProviderEndpointRepository::new(state.db_pool.clone());

    let node_message_repository = NodeMessageRepository::new(state.db_pool.clone());
    let provider_endpoint_service = ProviderEndpointService::new(provider_endpoint_repository);

    service
        .generate(
            state.db_pool.clone(),
            &state.chat_event_sessions,
            workspace_repository,
            node_repository,
            node_service,
            node_message_repository,
            provider_endpoint_service,
            state.stream_manager.clone(),
            &branch_id,
            &message,
            channel,
        )
        .await
        .inspect_err(|e| error!("AIGenerationService::generate: {}", e))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn regenerate_node<'a>(
    state: State<'a, AppState>,
    channel: Channel<ChatEventPayload>,
    payload: RegenerateNodePayload,
) -> Result<(), String> {
    let repository = AiGenerationRepository::new(state.db_pool.clone());
    let service = AiGenerationService::new(repository, state.db_pool.clone());

    service
        .regenerate_node(channel, payload, &state.chat_event_sessions)
        .await
        .inspect_err(|e| error!("AIGenerationService::regenerate_node: {}", e))
        .map_err(|e| e.to_string())
}
