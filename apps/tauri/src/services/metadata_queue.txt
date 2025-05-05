use std::sync::Arc;
use tokio::sync::mpsc::{self, Receiver, Sender};
use tracing::{debug, error, info};

use super::database::DbPool;

// Define the job type for our queue
#[derive(Debug)]
pub enum MetadataJob {
    UpdateMetrics {
        node_id: String,
        model_id: String,
        input_tokens: Option<usize>,
        output_tokens: Option<usize>,
    },
}

#[derive(Clone)]
pub struct MetadataQueue {
    sender: Sender<MetadataJob>,
}

impl MetadataQueue {
    pub fn new(pool: Arc<DbPool>) -> Self {
        // Create a channel with a buffer size of 100
        let (sender, receiver) = mpsc::channel::<MetadataJob>(100);

        // Start the background worker
        Self::start_worker(receiver, pool);

        info!("MetadataQueue initialized and worker started.");
        Self { sender }
    }

    // Method to submit jobs to the queue
    pub async fn enqueue(&self, job: MetadataJob) -> Result<(), String> {
        debug!("Attempting to enqueue metadata job: {:?}", job);
        match self.sender.send(job).await {
            Ok(_) => {
                debug!("Successfully enqueued metadata job");
                Ok(())
            }
            Err(e) => {
                error!("Failed to enqueue metadata job: {}", e);
                Err(format!("Queue send error: {}", e))
            }
        }
    }

    // Starts the background worker task
    fn start_worker(mut receiver: Receiver<MetadataJob>, pool: Arc<DbPool>) {
        tokio::spawn(async move {
            info!("Metadata queue worker task started.");
            while let Some(job) = receiver.recv().await {
                debug!("Received job in metadata worker: {:?}", job);
                if let Err(e) = Self::process_job(&pool, job).await {
                    error!("Failed to process metadata job: {}", e);
                    // Consider adding retry logic or dead-letter queue here in the future
                }
            }
            // This point is reached if the sender is dropped (application shutdown)
            info!("Metadata queue worker shutting down.");
        });
    }

    // Processes a single job
    async fn process_job(pool: &Arc<DbPool>, job: MetadataJob) -> Result<(), String> {
        match job {
            MetadataJob::UpdateMetrics {
                node_id,
                model_id,
                input_tokens,
                output_tokens,
            } => {
                info!(
                    "Processing metrics update for node_id: {}, model_id: {}, input_tokens: {:?}, output_tokens: {:?}",
                    node_id, model_id, input_tokens, output_tokens
                );

                // TODO: Implement database update logic here in the next step
                // For now, just simulate work
                tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

                debug!(
                    "Finished processing metrics update for node_id: {}",
                    node_id
                );
                Ok(())
            }
        }
    }
}
