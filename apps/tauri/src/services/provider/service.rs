use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};

use super::dtos::Provider;

#[derive(Clone)]
pub struct ProviderService {
    pool: Arc<SqlitePool>,
}

impl ProviderService {
    /// Create a new provider service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// Get all providers
    pub async fn get_all(&self) -> Result<Vec<Provider>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool).await
    }

    /// Get all providers with a specified executor
    pub async fn get_all_with_executor<'e, E>(
        &self,
        executor: E,
    ) -> Result<Vec<Provider>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Provider, "SELECT * FROM providers")
            .fetch_all(executor)
            .await
    }
}
