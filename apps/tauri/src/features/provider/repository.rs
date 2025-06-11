use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::Ulid;

use super::dtos::{NewProvider, Provider, UpdateProvider};

#[derive(Clone)]
pub struct ProviderRepository {
    pool: Arc<SqlitePool>,
}

impl ProviderRepository {
    /// Create a new provider service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get(&self, id: &str) -> Result<Provider, sqlx::Error> {
        self.get_with_executor(&*self.pool, id).await
    }

    /// Get a provider with a specified executor
    pub async fn get_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
    ) -> Result<Provider, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Provider, "SELECT * FROM providers WHERE id = ?", id)
            .fetch_one(executor)
            .await
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

    /// Create a new provider
    pub async fn create(&self, provider: NewProvider) -> Result<Provider, sqlx::Error> {
        self.create_with_executor(&*self.pool, provider).await
    }

    /// Create a new provider with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        provider: NewProvider,
    ) -> Result<Provider, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let id = provider.id.unwrap_or(Ulid::new().to_string());

        sqlx::query_as!(
            Provider,
            "
            INSERT INTO providers
            (
                id,
                marketplace_id,
                name,
                base_url,
                auth_type,
                json_auth_config,
                models_sync_strategy
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
            RETURNING *
            ",
            id,
            provider.marketplace_id,
            provider.name,
            provider.base_url,
            provider.auth_type,
            provider.json_auth_config,
            provider.models_sync_strategy,
        )
        .fetch_one(executor)
        .await
    }

    /// Update a provider
    pub async fn update(&self, provider: UpdateProvider) -> Result<Provider, sqlx::Error> {
        self.update_with_executor(&*self.pool, provider).await
    }

    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        provider: UpdateProvider,
    ) -> Result<Provider, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(
            provider_id = provider.id,
            "ProviderRepository::update_with_executor"
        );

        // Initialize QueryBuilder for SQLite
        let mut query_builder: QueryBuilder<sqlx::Sqlite> =
            QueryBuilder::new("UPDATE providers SET ");

        // Build the SET clause dynamically
        let mut separated = query_builder.separated(", ");

        if let Some(api_key_id) = provider.api_key_id {
            separated.push("api_key_id = ");
            separated.push_bind_unseparated(api_key_id);
        }

        separated.push("updated_at = CURRENT_TIMESTAMP");

        // Add WHERE clause and RETURNING clause
        query_builder
            .push(" WHERE id = ")
            .push_bind(provider.id)
            .push(" RETURNING *");

        // Prepare the query
        let query = query_builder.build_query_as::<Provider>();

        // Execute the query and map to Branch struct
        let branch = query.fetch_one(executor).await?;

        Ok(branch)
    }
}
