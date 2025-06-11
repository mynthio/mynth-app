pub mod errors;
pub mod json_lines_adapter;
pub mod sse_adapter;

use bytes::Bytes;
use futures_util::Stream;
use std::pin::Pin;

/// A trait for adapting different stream formats to a common JSON string stream.
/// This allows the AI client to be agnostic about whether the provider uses SSE, JSON lines, etc.
pub trait StreamAdapter {
    type Error: std::error::Error + Send + Sync + 'static;

    /// Extract JSON strings from a byte stream.
    /// Returns a stream of JSON strings that can be parsed by the response mapper.
    fn extract_json_strings<S, E>(
        &self,
        byte_stream: S,
    ) -> Pin<Box<dyn Stream<Item = Result<String, Self::Error>> + Send>>
    where
        S: Stream<Item = Result<Bytes, E>> + Send + 'static,
        E: std::error::Error + Send + Sync + 'static;
}

/// SSE (Server-Sent Events) stream adapter.
/// Extracts JSON from "data: " lines and stops on "[DONE]".
#[derive(Debug, Clone, Default)]
pub struct SseStreamAdapter;

impl StreamAdapter for SseStreamAdapter {
    type Error = std::io::Error; // Simple error type for now

    fn extract_json_strings<S, E>(
        &self,
        byte_stream: S,
    ) -> Pin<Box<dyn Stream<Item = Result<String, Self::Error>> + Send>>
    where
        S: Stream<Item = Result<Bytes, E>> + Send + 'static,
        E: std::error::Error + Send + Sync + 'static,
    {
        Box::pin(async_stream::stream! {
            let mut buffer = String::new();

            tokio::pin!(byte_stream);
            while let Some(chunk_result) = byte_stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        match String::from_utf8(chunk.to_vec()) {
                            Ok(chunk_str) => {
                                buffer.push_str(&chunk_str);

                                // Process complete lines
                                while let Some(newline_pos) = buffer.find('\n') {
                                    let line = buffer[..newline_pos].trim().to_string();
                                    buffer = buffer[newline_pos + 1..].to_string();

                                    // Process SSE data lines
                                    if let Some(json_str) = extract_json_from_sse_line(&line) {
                                        if json_str == "[DONE]" {
                                            return; // Stop the stream
                                        }
                                        if !json_str.is_empty() {
                                            yield Ok(json_str);
                                        }
                                    }
                                }
                            }
                            Err(e) => {
                                yield Err(std::io::Error::new(std::io::ErrorKind::InvalidData, e));
                                continue;
                            }
                        }
                    }
                    Err(_) => {
                        yield Err(std::io::Error::new(std::io::ErrorKind::Other, "Stream error"));
                        break;
                    }
                }
            }

            // Process any remaining data in buffer
            if !buffer.is_empty() {
                for line in buffer.lines() {
                    if let Some(json_str) = extract_json_from_sse_line(line.trim()) {
                        if json_str != "[DONE]" && !json_str.is_empty() {
                            yield Ok(json_str);
                        }
                    }
                }
            }
        })
    }
}

/// JSON Lines stream adapter.
/// Each line is expected to be a complete JSON object.
#[derive(Debug, Clone, Default)]
pub struct JsonLinesStreamAdapter;

impl StreamAdapter for JsonLinesStreamAdapter {
    type Error = std::io::Error;

    fn extract_json_strings<S, E>(
        &self,
        byte_stream: S,
    ) -> Pin<Box<dyn Stream<Item = Result<String, Self::Error>> + Send>>
    where
        S: Stream<Item = Result<Bytes, E>> + Send + 'static,
        E: std::error::Error + Send + Sync + 'static,
    {
        Box::pin(async_stream::stream! {
            let mut buffer = String::new();

            tokio::pin!(byte_stream);
            while let Some(chunk_result) = byte_stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        match String::from_utf8(chunk.to_vec()) {
                            Ok(chunk_str) => {
                                buffer.push_str(&chunk_str);

                                // Process complete lines
                                while let Some(newline_pos) = buffer.find('\n') {
                                    let line = buffer[..newline_pos].trim().to_string();
                                    buffer = buffer[newline_pos + 1..].to_string();

                                    if !line.is_empty() {
                                        yield Ok(line);
                                    }
                                }
                            }
                            Err(e) => {
                                yield Err(std::io::Error::new(std::io::ErrorKind::InvalidData, e));
                                continue;
                            }
                        }
                    }
                    Err(_) => {
                        yield Err(std::io::Error::new(std::io::ErrorKind::Other, "Stream error"));
                        break;
                    }
                }
            }

            // Process any remaining data in buffer
            if !buffer.is_empty() && !buffer.trim().is_empty() {
                yield Ok(buffer.trim().to_string());
            }
        })
    }
}

/// Helper function to extract JSON from SSE line
fn extract_json_from_sse_line(line: &str) -> Option<String> {
    if line.starts_with("data: ") {
        let data_content = line.trim_start_matches("data: ").trim();
        Some(data_content.to_string())
    } else {
        None
    }
}

use futures_util::StreamExt;
