mod commands;
mod models;
mod services;
mod utils;

use services::database::Database;
use std::fs;
use tauri::Manager;

// App state now uses our Database type
struct AppState {
    db: Database,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create the base builder with conditional devtools
    #[cfg(debug_assertions)]
    let builder = tauri::Builder::default().plugin(tauri_plugin_devtools::init());

    #[cfg(not(debug_assertions))]
    let builder = tauri::Builder::default();

    // Add the rest of your plugins and configuration
    builder
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        // .on_menu_event(|app, event| {
        //     app.emit("menu-event", event).unwrap();
        // })
        .invoke_handler(tauri::generate_handler![
            commands::chat::get_chats,
            commands::chat::get_chat,
            commands::chat::create_chat,
            commands::chat::update_chat,
            commands::chat::delete_chat,
            commands::chat_branch::get_chat_branches,
            commands::chat_branch::get_chat_branch,
            commands::chat_branch::get_chat_branch_nodes,
            commands::chat_branch::update_chat_branch,
            commands::chat_folder::update_chat_folder,
            commands::chat_folder::get_chat_folders,
            commands::chat_folder::delete_chat_folder,
            commands::ai::create_ai_integration,
            commands::ai::get_ai_integrations,
            commands::ai::get_ai_models,
            commands::ai::get_ai_integration,
            commands::ai::delete_ai_integration,
            commands::ai::set_ai_integration_api_key,
            commands::api_client::get_providers,
            commands::api_client::get_provider_models,
            commands::workspace::get_workspace,
            commands::workspace::get_workspaces,
            commands::message_generation::send_message,
            commands::message_generation::reconnect,
            commands::message_generation::unregister_stream,
            commands::message_generation::regenerate_message,
            commands::chat::switch_active_message_version,
        ])
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Create the directory if it doesn't exist
            fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

            let db_path = app_dir.join("mynth.db");

            // Initialize database and run migrations
            let db = tauri::async_runtime::block_on(async {
                // Get the path to the migrations directory
                let app_handle = app.handle();
                let resource_path = app_handle
                    .path()
                    .resource_dir()
                    .expect("Failed to get resource directory");
                let migrations_path = resource_path.join("migrations");

                // Pass the migrations path to the database initialization
                let db = Database::new(db_path.to_str().unwrap(), Some(migrations_path.as_path()))
                    .await
                    .unwrap();

                db
            });

            app.manage(AppState { db });

            // let window = app.get_webview_window("main").unwrap();

            // #[cfg(target_os = "macos")]
            // apply_vibrancy(
            //     &window,
            //     NSVisualEffectMaterial::HudWindow,
            //     Some(NSVisualEffectState::Active),
            //     Some(WINDOW_BORDER_RADIUS),
            // )
            // .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
