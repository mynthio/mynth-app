use futures_util::StreamExt;
use reqwest::Client;
use serde::Serialize;
use std::collections::HashMap;
use tauri::Manager;
use tauri::{ipc::Channel, AppHandle};
use window_vibrancy::*;
use std::sync::Arc;
use tokio::sync::Mutex;


const WINDOW_BORDER_RADIUS: f64 = 16.0;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum OllamaMessageEvent {
    #[serde(rename_all = "camelCase")]
    MessageReceived {
        message: String, // Change from &'a str to String to avoid lifetime issues
    },
}

struct StreamRegistry {
    streams: Mutex<HashMap<String, Channel<OllamaMessageEvent>>>,
    message_history: Mutex<HashMap<String, String>>, // Store message history for each chat_id
}

impl StreamRegistry {
    fn new() -> Self {
        StreamRegistry {
            streams: Mutex::new(HashMap::new()),
            message_history: Mutex::new(HashMap::new()),
        }
    }

    async fn add_stream(&self, chat_id: &str, channel: Channel<OllamaMessageEvent>) {
        self.streams.lock().await.insert(chat_id.to_string(), channel);
    }

    async fn get_stream(&self, chat_id: &str) -> Option<Channel<OllamaMessageEvent>> {
        self.streams.lock().await.get(chat_id).cloned()
    }

    async fn remove_stream(&self, chat_id: &str) {
        self.streams.lock().await.remove(chat_id);
        self.message_history.lock().await.remove(chat_id); // Clear history on stream removal
    }

    async fn append_to_history(&self, chat_id: &str, message: &str) {
        let mut history = self.message_history.lock().await;
        history.entry(chat_id.to_string()).or_insert_with(String::new).push_str(message);
        println!("History updated for {}: {:?}", chat_id, history.get(chat_id));
    }

    async fn get_history(&self, chat_id: &str) -> Option<String> {
        self.message_history.lock().await.get(chat_id).cloned()
    }
}


// Initialize the StreamRegistry as a global instance
lazy_static::lazy_static! {
    static ref STREAM_REGISTRY: Arc<StreamRegistry> = Arc::new(StreamRegistry::new());
}

#[tauri::command]
async fn stream_ollama_messages(
    app: AppHandle,
    chat_id: String,
    on_event: Channel<OllamaMessageEvent>,
    prompt: String,
) -> Result<(), String> {
    let client = Client::new();

    // Check for an active stream
    if STREAM_REGISTRY.get_stream(&chat_id).await.is_some() {
        return Err("Stream already active for this chat session".to_string());
    }

    // Add stream to registry
    STREAM_REGISTRY.add_stream(&chat_id, on_event.clone()).await;

    let response = client
        .post("http://localhost:11434/api/generate")
        .json(&serde_json::json!({ "model": "llama3.2:1b", "prompt": prompt }))
        .send()
        .await
        .expect("failed to send request");

    if !response.status().is_success() {
        eprintln!("Failed to get response: {:?}", response.status());
        STREAM_REGISTRY.remove_stream(&chat_id).await;
        return Ok(());
    }

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let data = chunk.unwrap();
        if let Ok(text) = String::from_utf8(data.to_vec()) {
            // Send the message to the channel
            if let Some(channel) = STREAM_REGISTRY.get_stream(&chat_id).await {
                channel
                    .send(OllamaMessageEvent::MessageReceived { message: text.clone() })
                    .unwrap();

                // Store the message in history
                STREAM_REGISTRY.append_to_history(&chat_id, &text).await;
            } else {
                break;
            }
        }
    }

    STREAM_REGISTRY.remove_stream(&chat_id).await;
    Ok(())
}

#[tauri::command]
async fn reconnect_ollama_stream(
    chat_id: String,
    new_channel: Channel<OllamaMessageEvent>,
) -> Result<(), String> {
    if let Some(existing_channel) = STREAM_REGISTRY.get_stream(&chat_id).await {
        STREAM_REGISTRY.add_stream(&chat_id, new_channel.clone()).await;

        // Send the entire message history to the new channel
        if let Some(history) = STREAM_REGISTRY.get_history(&chat_id).await {
            new_channel.send(OllamaMessageEvent::MessageReceived { message: history }).unwrap();
        }

        Ok(())
    } else {
        Err("No active stream found for this chat ID".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![stream_ollama_messages, reconnect_ollama_stream])
        .setup(|app| {
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
