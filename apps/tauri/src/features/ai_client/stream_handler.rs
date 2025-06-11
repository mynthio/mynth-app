// // src/ai_streams/handler.rs
// use super::{
//     dtos::{ParsedSsePayload, StreamUpdate, UsageInfo},
//     errors::AiStreamHandlerError, // This error will now be generic over the adapter's error
//     stream_adapters,
// };
// // Import your adapters

// use bytes::Bytes;
// use futures_util::{Stream, StreamExt, TryStreamExt};
// use tracing::{debug, error, warn};

// pub struct AiStreamProcessor;

// impl AiStreamProcessor {
//     /// Core logic: processes a stream of JSON strings using a payload mapper.
//     /// This is the common function that both SSE and JSON Lines will use.
//     fn process_json_strings_to_updates<
//         JsonStringStream,
//         JsonStringStreamError,
//         MapperFn,
//         MapperError,
//     >(
//         json_string_stream: JsonStringStream,
//         mut payload_mapper: MapperFn,
//     ) -> impl Stream<Item = StreamUpdate>
//     where
//         JsonStringStream:
//             Stream<Item = Result<String, JsonStringStreamError>> + Unpin + Send + 'static,
//         JsonStringStreamError: std::error::Error + Send + Sync + 'static,
//         MapperFn: FnMut(&str) -> Result<ParsedSsePayload, MapperError> + Send + 'static,
//         MapperError: std::error::Error + Send + Sync + 'static,
//     {
//         let mut accumulated_text = String::new();
//         let mut last_seen_usage: Option<UsageInfo> = None;
//         let mut stream_ended_with_usage = false; // Renamed for clarity

//         async_stream::stream! {
//             // Map Result<String, JsonStringStreamError> to Result<ParsedSsePayload, AiStreamHandlerError>
//             let mut mapped_payload_stream = json_string_stream
//                 .map_err(|e| AiStreamHandlerError::PayloadStream(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)) // Box the error
//                 .and_then(|json_str| async {
//                     payload_mapper(&json_str).map_err(|e| AiStreamHandlerError::DataMapping(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)) // Box the error
//                 });

//             while let Some(payload_result) = mapped_payload_stream.next().await {
//                 match payload_result {
//                     Ok(parsed_payload) => {
//                         debug!(payload = ?parsed_payload, "Processed Payload from JSON string");

//                         if let Some(delta) = parsed_payload.delta_content {
//                             if !delta.is_empty() {
//                                 accumulated_text.push_str(&delta);
//                                 yield StreamUpdate::Content(delta);
//                             }
//                         }

//                         if let Some(usage) = parsed_payload.usage {
//                             last_seen_usage = Some(usage);
//                             stream_ended_with_usage = true;
//                         }
//                          if parsed_payload.is_final_provider_chunk && last_seen_usage.is_some() && !stream_ended_with_usage {
//                             stream_ended_with_usage = true;
//                         }
//                     }
//                     Err(e) => {
//                         error!(error = ?e, "Error processing AI stream payload");
//                         // Simplified error reporting for this example; you might want more specific fatal checks
//                         let is_fatal = true; // Default to fatal for unknown stream/mapping errors
//                         // You'd need to inspect `e` to determine if it's truly fatal
//                         // e.g. if e.source() is an Upstream error from the adapter.
//                         yield StreamUpdate::StreamError{ message: e.to_string(), is_fatal };
//                         if is_fatal {
//                             break;
//                         }
//                     }
//                 }
//             }

//             if let Some(usage) = last_seen_usage {
//                 debug!(usage = ?usage, "Yielding final usage information");
//                 yield StreamUpdate::Usage(usage);
//             } else if stream_ended_with_usage {
//                  warn!("Stream indicated usage was present, but none was captured to yield.");
//             }
//             debug!(full_text = %accumulated_text, "AI Stream processing complete.");
//         }
//     }

//     /// Processes an SSE-formatted byte stream.
//     pub fn handle_sse_stream<ByteStream, ByteStreamError, MapperFn, MapperError>(
//         byte_stream: ByteStream,
//         payload_mapper: MapperFn,
//     ) -> impl Stream<Item = StreamUpdate>
//     where
//         ByteStream: Stream<Item = Result<Bytes, ByteStreamError>> + Unpin + Send + 'static,
//         ByteStreamError: std::error::Error + Send + Sync + 'static,
//         MapperFn: FnMut(&str) -> Result<ParsedSsePayload, MapperError> + Send + 'static,
//         MapperError: std::error::Error + Send + Sync + 'static,
//     {
//         let sse_json_payloads =
//             stream_adapters::sse_adapter::SseJsonExtractor::extract_json_strings(byte_stream);
//         Self::process_json_strings_to_updates::<
//             _,
//             stream_adapters::errors::StreamAdapterError<ByteStreamError>,
//             _,
//             _,
//         >(sse_json_payloads, payload_mapper)
//     }

//     /// Processes a JSON Lines-formatted byte stream.
//     pub fn handle_json_lines_stream<ByteStream, ByteStreamError, MapperFn, MapperError>(
//         byte_stream: ByteStream,
//         payload_mapper: MapperFn,
//     ) -> impl Stream<Item = StreamUpdate>
//     where
//         ByteStream: Stream<Item = Result<Bytes, ByteStreamError>> + Unpin + Send + 'static,
//         ByteStreamError: std::error::Error + Send + Sync + 'static,
//         MapperFn: FnMut(&str) -> Result<ParsedSsePayload, MapperError> + Send + 'static,
//         MapperError: std::error::Error + Send + Sync + 'static,
//     {
//         let json_payloads = json_lines_adapter::json_lines_payloads(byte_stream); // Use the new adapter
//         Self::process_json_strings_to_updates::<
//             _,
//             stream_adapters::errors::StreamAdapterError<ByteStreamError>,
//             _,
//             _,
//         >(json_payloads, payload_mapper)
//     }
// }

// // Modify AiStreamHandlerError to be generic over the payload stream error and mapper error
// // src/ai_streams/errors.rs
// // (Original AiStreamHandlerError definition)
// // #[derive(Error, Debug)]
// // pub enum AiStreamHandlerError<UpstreamError, MapperError>
// // ...
// // New definition:
// // src/ai_streams/errors.rs
// use thiserror::Error;

// #[derive(Error, Debug)]
// pub enum AiStreamHandlerError {
//     // No longer generic at the top level for simplicity of StreamUpdate
//     #[error("Error from payload stream adapter: {0}")]
//     PayloadStream(#[source] Box<dyn std::error::Error + Send + Sync>), // Use Box for type erasure

//     #[error("Error mapping provider data: {0}")]
//     DataMapping(#[source] Box<dyn std::error::Error + Send + Sync>), // Use Box for type erasure

//     #[error("Stream unexpectedly ended")]
//     UnexpectedEndOfStream,
// }
