use super::ai::AiService;
use super::chat::ChatService;
use super::chat_branch::ChatBranchService;
use super::chat_folder::ChatFolderService;
use super::chat_node::ChatNodeService;
use super::message_generation::MessageGenerationService;
use super::metadata_queue::MetadataQueue;
use super::workspace::WorkspaceService;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Sqlite, Transaction,
};
use std::future::Future;
use std::path::Path;
use std::pin::Pin;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tracing::{debug, info};

pub struct DbPool {
    inner: Pool<Sqlite>,
}

impl DbPool {
    pub fn get(&self) -> &Pool<Sqlite> {
        &self.inner
    }
}

pub struct Database {
    pub folders: ChatFolderService,
    pub chats: ChatService,
    pub chat_branch: ChatBranchService,
    pub ai: AiService,
    pub workspaces: WorkspaceService,
    pub chat_node: ChatNodeService,
    pub message_generation: MessageGenerationService,
    pub metadata_queue: MetadataQueue,
    // Wrapped in Arc to enable shared ownership without cloning the pool itself
    pool: Arc<DbPool>,
}

impl Database {
    pub async fn new(
        database_url: &str,
        migrations_path: Option<&Path>,
    ) -> Result<Self, sqlx::Error> {
        info!("Initializing database at: {}", database_url);

        // Enhanced SQLite connection options with WAL mode for better concurrency
        let connect_options = SqliteConnectOptions::from_str(database_url)?
            .create_if_missing(true)
            .foreign_keys(true) // Enforce foreign key constraints
            .pragma("journal_mode", "WAL") // Write-Ahead Logging for better concurrency
            .pragma("synchronous", "NORMAL") // Good balance of safety and performance
            .pragma("busy_timeout", "5000") // Wait up to 5 seconds when database is busy
            .pragma("cache_size", "-2000"); // 2MB page cache (negative means kibibytes)

        debug!("Configured SQLite connection options with WAL mode and optimized settings");

        // Configure connection pool with appropriate limits
        let sqlite_pool = SqlitePoolOptions::new()
            .max_connections(10) // Adjust based on expected concurrent users
            .min_connections(1) // Keep at least one connection ready
            .acquire_timeout(Duration::from_secs(30)) // Don't wait indefinitely for connections
            .idle_timeout(Duration::from_secs(300)) // Close idle connections after 5 minutes
            .connect_with(connect_options)
            .await?;

        debug!("Created SQLite connection pool with configured limits");

        // Run migrations using the pool
        info!("Running database migrations");
        // Use the provided migrations path or fall back to the default
        let migrations_dir = migrations_path.unwrap_or_else(|| Path::new("migrations"));
        sqlx::migrate::Migrator::new(migrations_dir)
            .await?
            .run(&sqlite_pool)
            .await?;

        info!("Database migrations completed successfully");

        // Wrap the SQLx pool in our DbPool struct and then in an Arc for shared ownership
        let pool = Arc::new(DbPool { inner: sqlite_pool });

        // Create services with references to the pool
        let folders = ChatFolderService::new(Arc::clone(&pool));
        let chats = ChatService::new(Arc::clone(&pool), &folders);
        let ai = AiService::new(Arc::clone(&pool));
        let workspaces = WorkspaceService::new(Arc::clone(&pool));
        let chat_branch = ChatBranchService::new(Arc::clone(&pool));
        let chat_node = ChatNodeService::new(Arc::clone(&pool));
        let message_generation =
            MessageGenerationService::new(Arc::clone(&pool), chat_node.clone());
        let metadata_queue = MetadataQueue::new(Arc::clone(&pool));

        info!("Database services initialized successfully");

        Ok(Self {
            folders,
            chats,
            chat_branch,
            ai,
            workspaces,
            chat_node,
            message_generation,
            metadata_queue,
            pool,
        })
    }

    // Get a transaction for multi-operation database calls
    pub async fn transaction<'a>(&self) -> Result<Transaction<'a, Sqlite>, sqlx::Error> {
        self.pool.get().begin().await
    }

    // Helper to run operations in a transaction
    pub async fn with_transaction<F, R, E>(&self, f: F) -> Result<R, E>
    where
        F: FnOnce(
            Transaction<'_, Sqlite>,
        ) -> Pin<
            Box<dyn Future<Output = Result<(R, Transaction<'_, Sqlite>), E>> + Send + '_>,
        >,
        E: From<sqlx::Error> + Send,
        R: Send,
    {
        let pool = self.pool.get();
        let tx = pool.begin().await?;

        // Execute the transaction function, which now returns both the result and the transaction
        let (result, tx) = f(tx).await?;

        // Commit the transaction
        tx.commit().await?;

        Ok(result)
    }
}
