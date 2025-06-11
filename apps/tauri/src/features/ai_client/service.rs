use super::stream_adapters::{SseStreamAdapter, StreamAdapter};
use anyhow::{Error, Result};
use futures_util::{Stream, StreamExt};
use reqwest::Client;
use serde_json::Value;
use std::collections::HashMap;
use tracing::{debug, error};

/// A clean, focused AI client that handles HTTP communication and stream processing.
/// This is separate from the AI generation orchestration logic.
/// The AI client only handles transport - HTTP requests and stream format parsing.
pub struct AiClient {
    http_client: Client,
}

#[derive(Debug, Clone)]
pub struct StreamRequest {
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Value,
    // Instead of response mapper, we use a stream adapter for format handling
}

impl AiClient {
    pub fn new() -> Self {
        Self {
            http_client: Client::new(),
        }
    }

    /// Stream a request using the provided stream adapter and yield raw JSON strings.
    /// The AI generation service will handle response mapping.
    pub async fn stream_request_with_adapter<A>(
        &self,
        request: StreamRequest,
        adapter: A,
    ) -> Result<impl Stream<Item = Result<String, A::Error>> + Send>
    where
        A: StreamAdapter + Send + 'static,
    {
        debug!(url = %request.url, "Starting AI stream request");

        // Build the HTTP request
        let mut http_request = self.http_client.post(&request.url).json(&request.body);

        // Add headers
        for (key, value) in request.headers {
            http_request = http_request.header(key, value);
        }

        // Send the request
        let response = http_request.send().await?;

        if !response.status().is_success() {
            return Err(Error::msg(format!(
                "HTTP request failed with status: {}",
                response.status()
            )));
        }

        // Use the provided adapter to extract JSON strings
        let json_stream = adapter.extract_json_strings(response.bytes_stream());

        Ok(json_stream)
    }
}

impl Default for AiClient {
    fn default() -> Self {
        Self::new()
    }
}
