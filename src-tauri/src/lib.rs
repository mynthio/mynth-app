use futures_util::StreamExt;
use reqwest::Client;
use tauri::command;
use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[command]
async fn call_ollama_model(prompt: String) -> Result<String, String> {
    let client = Client::new();

    let response = client
        .post("http://localhost:11434/api/generate")
        .json(&serde_json::json!({ 	"model": "llama3.2:1b", "prompt": prompt }))
        .send()
        .await
        .expect("failed to send request");

    // Ensure the response is a success before processing
    if !response.status().is_success() {
        eprintln!("Failed to get response: {:?}", response.status());
        return Ok(String::new());
    }

    // Stream the response and concatenate into a single string
    let mut full_response = String::new();
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let data = chunk.unwrap();
        // Convert bytes to string and append to the response
        if let Ok(text) = String::from_utf8(data.to_vec()) {
            full_response.push_str(&text);
        }
    }

    Ok(full_response)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, Some(12.0))
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![call_ollama_model])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
