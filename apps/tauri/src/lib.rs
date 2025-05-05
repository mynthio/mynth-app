mod services;
mod utils;

use services::database::init_database;
use sqlx::SqlitePool;
use std::{fs, sync::Arc};
use tauri::Manager;

// App state now uses our Database type
struct AppState {
    db_pool: Arc<SqlitePool>,
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
            services::workspace::commands::get_workspace,
            services::workspace::commands::get_all_workspaces,
            //
            // CHAT
            //
            services::chat::commands::get_all_chats,
            //
            // AI GENERATION
            //
            services::ai_generation::commands::generate_text,
        ])
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;
            fs::create_dir_all(&app_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
            let db_path = app_dir.join("mynth.db");

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

            app.manage(AppState { db_pool });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
