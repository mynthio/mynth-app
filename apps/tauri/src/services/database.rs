use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};
use std::path::Path;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tracing::{debug, info};

#[derive(Debug, Error)]
pub enum DatabaseError {
    #[error("SQLx error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Migration error: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),
    #[error("Invalid database URL: {0}")]
    Url(#[from] std::path::StripPrefixError),
    #[error("Migrations directory does not exist: {0}")]
    InvalidMigrationsPath(String),
}

pub async fn init_database(
    database_url: &str,
    migrations_path: Option<&Path>,
) -> Result<Arc<SqlitePool>, DatabaseError> {
    info!("Initializing database at: {}", database_url);

    let connect_options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true)
        .foreign_keys(true)
        .pragma("journal_mode", "WAL")
        .pragma("synchronous", "NORMAL")
        .pragma("busy_timeout", "5000")
        .pragma("cache_size", "-2000");

    debug!("Configured SQLite connection options with WAL mode and optimized settings");

    let sqlite_pool = SqlitePoolOptions::new()
        .max_connections(4)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(300))
        .connect_with(connect_options)
        .await?;

    debug!("Created SQLite connection pool with configured limits");

    info!("Running database migrations");
    let migrations_dir = migrations_path.unwrap_or_else(|| Path::new("migrations"));
    if !migrations_dir.exists() {
        return Err(DatabaseError::InvalidMigrationsPath(
            migrations_dir.to_string_lossy().into(),
        ));
    }
    sqlx::migrate::Migrator::new(migrations_dir)
        .await?
        .run(&sqlite_pool)
        .await?;

    info!("Database migrations completed successfully");

    Ok(Arc::new(sqlite_pool))
}
