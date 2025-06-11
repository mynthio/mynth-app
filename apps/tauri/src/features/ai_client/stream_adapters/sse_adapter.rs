use bytes::Bytes;
use futures_util::{Stream, StreamExt};
use std::pin::Pin;

/// A simple utility for extracting JSON strings from Server-Sent Events (SSE) streams.
/// This is designed to work seamlessly with reqwest's bytes_stream().
pub struct SseJsonExtractor;

impl SseJsonExtractor {
    /// Extracts JSON strings from an SSE byte stream.
    ///
    /// Takes a stream of bytes (like from reqwest::Response::bytes_stream())
    /// and yields individual JSON strings found in "data: " lines.
    ///
    /// Stops when "[DONE]" is encountered, which is common in OpenAI-style streaming APIs.
    ///
    /// # Example
    /// ```rust
    /// let response = client.post(url).send().await?;
    /// let json_stream = SseJsonExtractor::extract_json_strings(response.bytes_stream());
    ///
    /// while let Some(json_str) = json_stream.next().await {
    ///     // Process your JSON string here
    ///     println!("Received: {}", json_str);
    /// }
    /// ```
    pub fn extract_json_strings<S, E>(byte_stream: S) -> Pin<Box<dyn Stream<Item = String> + Send>>
    where
        S: Stream<Item = Result<Bytes, E>> + Send + 'static,
        E: std::error::Error + Send + Sync + 'static,
    {
        Box::pin(async_stream::stream! {
            let mut buffer = String::new();

            // Collect all chunks and process them as complete lines
            tokio::pin!(byte_stream);
            while let Some(chunk_result) = byte_stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        // Convert bytes to string (handling partial UTF-8 sequences gracefully)
                        match String::from_utf8(chunk.to_vec()) {
                            Ok(chunk_str) => {
                                buffer.push_str(&chunk_str);

                                // Process complete lines
                                while let Some(newline_pos) = buffer.find('\n') {
                                    let line = buffer[..newline_pos].trim().to_string();
                                    buffer = buffer[newline_pos + 1..].to_string();

                                    // Process SSE data lines
                                    if let Some(json_str) = Self::extract_json_from_sse_line(&line) {
                                        if json_str == "[DONE]" {
                                            return; // Stop the stream
                                        }
                                        if !json_str.is_empty() {
                                            yield json_str;
                                        }
                                    }
                                }
                            }
                            Err(_) => {
                                // Skip malformed UTF-8 chunks (could log this if needed)
                                continue;
                            }
                        }
                    }
                    Err(_) => {
                        // Stream error occurred, we could log this but for simplicity we'll just stop
                        break;
                    }
                }
            }

            // Process any remaining data in buffer
            if !buffer.is_empty() {
                for line in buffer.lines() {
                    if let Some(json_str) = Self::extract_json_from_sse_line(line.trim()) {
                        if json_str != "[DONE]" && !json_str.is_empty() {
                            yield json_str;
                        }
                    }
                }
            }
        })
    }

    /// Extract JSON string from a single SSE line.
    /// Returns Some(json_string) if the line contains SSE data, None otherwise.
    fn extract_json_from_sse_line(line: &str) -> Option<String> {
        if line.starts_with("data: ") {
            let data_content = line.trim_start_matches("data: ").trim();
            Some(data_content.to_string())
        } else {
            None
        }
    }
}
