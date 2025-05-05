use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};

use super::dtos::ProviderEndpoint;

#[derive(Clone)]
pub struct ProviderEndpointService {
    pool: Arc<SqlitePool>,
}

impl ProviderEndpointService {
    /// Create a new provider endpoint service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// Get all provider endpoints
    pub async fn get_all(&self) -> Result<Vec<ProviderEndpoint>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool).await
    }

    /// Get all provider endpoints with a specified executor
    pub async fn get_all_with_executor<'e, E>(
        &self,
        executor: E,
    ) -> Result<Vec<ProviderEndpoint>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(ProviderEndpoint, "SELECT * FROM provider_endpoints")
            .fetch_all(executor)
            .await
    }
}

// This service is as minimal as possible, just like its provider sibling. If you need more, add with care and a smile! 😄
