mod commands;
mod models;
mod services;

use services::database::Database;
use tauri::Manager;
use window_vibrancy::*;

const WINDOW_BORDER_RADIUS: f64 = 11.0;

// App state now uses our Database type
struct AppState {
    db: Database,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![commands::chat::fetch_chats])
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            let db_path = app_dir.join("mynth.db");

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
