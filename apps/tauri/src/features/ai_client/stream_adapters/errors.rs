// src/stream_adapters/errors.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum StreamAdapterError<UpstreamError>
where
    UpstreamError: std::error::Error + Send + Sync + 'static,
{
    #[error("Upstream byte stream error: {0}")]
    Upstream(#[source] UpstreamError),
    #[error("Line/Frame codec I/O error: {0}")]
    CodecIo(#[from] std::io::Error),
    #[error("Invalid data format from stream: {0}")]
    InvalidFormat(String), // For cases where the adapter itself can detect bad format
}
