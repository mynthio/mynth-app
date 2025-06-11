mod features;
mod utils;

use dashmap::DashMap;
use features::{
    chat_stream_manager::service::ChatStreamManager, database::init_database,
    event_sessions::dtos::ChatEventSession,
};
use sqlx::SqlitePool;
use std::{fs, sync::Arc};
use tauri::Manager;

use crate::features::dev_kit::DevKit;

// App state now includes both old stream manager and new event sessions
struct AppState {
    db_pool: Arc<SqlitePool>,
    stream_manager: Arc<ChatStreamManager>,
    chat_event_sessions: Arc<DashMap<String, ChatEventSession>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create the base builder with conditional devtools
    #[cfg(debug_assertions)]
    let builder = tauri::Builder::default().plugin(tauri_plugin_devtools::init());

    #[cfg(not(debug_assertions))]
    let builder = tauri::Builder::default();

    builder
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            //
            // WORKSPACE
            //
            features::workspace::commands::get_workspace,
            features::workspace::commands::get_all_workspaces,
            features::workspace::commands::select_workspace_config,
            //
            // CHAT
            //
            features::chat::commands::get_chat,
            features::chat::commands::get_all_chats,
            features::chat::commands::create_chat,
            features::chat::commands::update_chat,
            //
            // BRANCH
            //
            features::branch::commands::get_branch,
            features::branch::commands::branch_get_all_by_chat_id,
            features::branch::commands::update_branch,
            features::branch::commands::clone_branch,
            //
            // NODE
            //
            features::node::commands::get_all_nodes_by_branch_id,
            features::node::commands::get_all_nodes_by_branch_id_formatted,
            features::node::commands::update_node,
            //
            // NODE MESSAGE
            //
            features::node_message::commands::get_all_node_messages_by_node_id,
            features::node_message::commands::get_all_node_messages_by_node_id_formatted,
            //
            // PROVIDER
            //
            features::provider::commands::get_provider,
            features::provider::commands::get_all_providers,
            features::provider::commands::update_provider_api_key,
            features::provider::commands::integrate_provider,
            //
            // PROVIDER ENDPOINT
            //
            features::provider_endpoint::commands::call_chat,
            //
            // MODEL
            //
            features::model::commands::get_model,
            features::model::commands::get_all_models,
            features::model::commands::update_model,
            //
            // AI GENERATION
            //
            features::ai_generation::commands::generate_text,
            features::ai_generation::commands::regenerate_node,
            //
            // CHAT STREAM MANAGER
            //
            features::chat_stream_manager::commands::connect_chat_stream,
            //
            // MCP SERVER
            //
            features::mcp_server::commands::find_all_mcp_servers,
            //
            // MARKETPLACE API
            //
            features::marketplace_api::commands::marketplace_api_list_providers,
        ])
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;
            fs::create_dir_all(&app_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
            let db_path = app_dir.join("mynth.db");

            // Start proto installation in background - don't block app startup
            let dev_kit = DevKit::new(app_dir.clone());
            tauri::async_runtime::spawn(async move {
                match dev_kit.ensure_tools_installed() {
                    Ok(()) => {
                        println!("✅ Dev tools installation completed successfully");
                        dev_kit.install_tool("node", None, false).unwrap();
                        dev_kit.run_tool("node", None, &["--version"]).unwrap();
                    }
                    Err(e) => {
                        eprintln!("⚠️  Dev tools installation failed (app will continue without proto): {}", e);
                        // Could potentially emit an event to the frontend here if needed
                    }
                }
            });

            let db_pool = tauri::async_runtime::block_on(async {
                let resource_path = app
                    .handle()
                    .path()
                    .resource_dir()
                    .map_err(|e| format!("Failed to get resource directory: {}", e))?;
                let migrations_path = resource_path.join("migrations");
                init_database(
                    db_path.to_str().ok_or("Invalid database path")?,
                    Some(migrations_path.as_path()),
                )
                .await
                .map_err(|e| format!("Failed to initialize database: {}", e))
            })?;

            let stream_manager = Arc::new(ChatStreamManager::new());

            app.manage(AppState {
                db_pool,
                stream_manager,
                chat_event_sessions: Arc::new(DashMap::new()),
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
