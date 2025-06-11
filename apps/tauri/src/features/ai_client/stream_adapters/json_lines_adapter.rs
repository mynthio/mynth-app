// // src/stream_adapters/json_lines_adapter.rs
// use super::errors::StreamAdapterError; // Define this error type
// use bytes::Bytes;
// use futures_util::{Stream, StreamExt, TryStreamExt};
// use tokio_util::codec::{FramedRead, LinesCodec};
// use tracing::debug;

// /// Processes a raw byte stream where each line is expected to be a JSON object.
// /// It handles line splitting and UTF-8 decoding.
// pub fn json_lines_payloads<ByteStream, ByteStreamError>(
//     raw_byte_stream: ByteStream,
// ) -> impl Stream<Item = Result<String, StreamAdapterError<ByteStreamError>>>
// where
//     ByteStream: Stream<Item = Result<Bytes, ByteStreamError>> + Unpin + Send,
//     ByteStreamError: std::error::Error + Send + Sync + 'static,
// {
//     let async_read =
//         tokio_util::io::StreamReader::new(raw_byte_stream.map_err(StreamAdapterError::Upstream));
//     let lines_codec_stream = FramedRead::new(async_read, LinesCodec::new());

//     async_stream::try_stream! {
//         #[for_await]
//         for line_result in lines_codec_stream {
//             let line = line_result.map_err(StreamAdapterError::CodecIo)?;
//             let trimmed_line = line.trim(); // Trim whitespace

//             if !trimmed_line.is_empty() {
//                 debug!(json_line = %trimmed_line, "JSON Line Received");
//                 yield trimmed_line.to_string();
//             } else {
//                 // Optionally ignore empty lines or treat as an error depending on provider spec
//                 debug!("Empty line received in JSON Lines stream, ignoring.");
//             }
//         }
//     }
// }
