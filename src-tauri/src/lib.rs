mod commands;
mod models;
mod services;

use services::database::Database;
use std::fs;
use tauri::{menu::Menu, Emitter, Event, Manager};
use window_vibrancy::*;

const WINDOW_BORDER_RADIUS: f64 = 11.0;

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
        .invoke_handler(tauri::generate_handler![
            commands::chat::fetch_chats,
            commands::chat::get_flat_structure,
            commands::chat::update_chat,
            commands::chat_folder::update_chat_folder,
            commands::ai::create_ai_integration,
            commands::ai::create_ai_model,
            commands::ai::get_ai_integrations
        ])
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Create the directory if it doesn't exist
            fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

            let db_path = app_dir.join("mynth.db");

            // TODO: Implement proper database migration system
            // - Automated database creation
            // - Migration runner for SQL files
            // - Schema version tracking
            // - Error handling for failed migrations
            let db = tauri::async_runtime::block_on(async {
                Database::new(db_path.to_str().unwrap()).await.unwrap()
            });

            app.manage(AppState { db });

            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(
                &window,
                NSVisualEffectMaterial::HudWindow,
                Some(NSVisualEffectState::Active),
                Some(WINDOW_BORDER_RADIUS),
            )
            .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
