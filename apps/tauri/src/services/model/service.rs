use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};

use super::dtos::Model;

#[derive(Clone)]
pub struct ModelService {
    pool: Arc<SqlitePool>,
}

impl ModelService {
    /// Create a new chat node message service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    // Get all models
    pub async fn get_all(&self) -> Result<Vec<Model>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool).await
    }

    // Get all models with a specified executor
    pub async fn get_all_with_executor<'e, E>(&self, executor: E) -> Result<Vec<Model>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Model, "SELECT * FROM models")
            .fetch_all(executor)
            .await
    }

    // Get all models by provider id
    pub async fn find_all_by_provider_id(
        &self,
        provider_id: &str,
    ) -> Result<Vec<Model>, sqlx::Error> {
        self.find_all_by_provider_id_with_executor(provider_id, &*self.pool)
            .await
    }

    // Get all models by provider id with a specified executor
    pub async fn find_all_by_provider_id_with_executor<'e, E>(
        &self,
        provider_id: &str,
        executor: E,
    ) -> Result<Vec<Model>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(
            Model,
            "SELECT * FROM models WHERE provider_id = ?",
            provider_id
        )
        .fetch_all(executor)
        .await
    }
}
