use futures::StreamExt;
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde_json::json;
use std::error::Error;

/// Message for chat completions
#[derive(Clone, Debug, serde::Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// AI client for text generation (stateless, config is per-request)
pub struct AIClient {
    pub http_client: Client,
}

/// Errors that can occur during streaming.
#[derive(Debug)]
pub enum StreamingError {
    ReqwestError(reqwest::Error),
    JsonError(serde_json::Error),
    HttpError(u16),
}

impl std::fmt::Display for StreamingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StreamingError::ReqwestError(e) => write!(f, "Request error: {}", e),
            StreamingError::JsonError(e) => write!(f, "JSON parsing error: {}", e),
            StreamingError::HttpError(code) => write!(f, "HTTP error: {}", code),
        }
    }
}

impl Error for StreamingError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            StreamingError::ReqwestError(e) => Some(e),
            StreamingError::JsonError(e) => Some(e),
            StreamingError::HttpError(_) => None,
        }
    }
}

impl AIClient {
    pub fn new() -> Self {
        Self {
            http_client: Client::new(),
        }
    }

    /// Generate text using chat completions API with message history only, using reqwest for streaming
    /// - url: full URL including path
    /// - model: model id/name
    /// - messages: chat history
    pub async fn generate_chat_stream<T>(
        &self,
        url: String,
        model: String,
        messages: Vec<ChatMessage>,
    ) -> Result<impl StreamExt<Item = Result<T, StreamingError>>, StreamingError>
    where
        T: DeserializeOwned,
    {
        // Prepare the request body
        let body = json!({
            "model": model,
            "messages": messages,
            "stream": true,
            // Add more fields as needed for your API
        });

        // Make the streaming POST request
        let response = self
            .http_client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| StreamingError::ReqwestError(e))?;

        // Ensure the response is successful (2xx)
        if !response.status().is_success() {
            return Err(StreamingError::HttpError(response.status().as_u16()));
        }

        // Get the streaming body
        let stream = response.bytes_stream();

        // Map the byte stream to deserialized objects
        let stream = stream.map(|chunk| {
            chunk
                .map_err(StreamingError::ReqwestError)
                .and_then(|bytes| {
                    // Parse the chunk as JSON
                    serde_json::from_slice::<T>(&bytes).map_err(StreamingError::JsonError)
                })
        });

        Ok(stream)
    }
}

// Comments for contributors:
// - AIClient is now stateless regarding model/provider config. Pass url/model/messages per request.
// - The response is streamed as JSON objects with `text` and `done` fields for compatibility.
// - If your backend uses a different streaming format, adjust the chunk parsing logic accordingly.
// - Enjoy hacking! (And don't forget to run `pnpm moon tauri:check` after changes.)
