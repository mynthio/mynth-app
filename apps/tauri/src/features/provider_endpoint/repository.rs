use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::{Generator, Ulid};

use super::dtos::{NewProviderEndpoint, ProviderEndpoint};

const BIND_LIMIT: usize = 32766;

#[derive(Clone)]
pub struct ProviderEndpointRepository {
    pool: Arc<SqlitePool>,
}

impl ProviderEndpointRepository {
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

    pub async fn create(
        &self,
        provider_endpoint: NewProviderEndpoint,
    ) -> Result<ProviderEndpoint, sqlx::Error> {
        self.create_with_executor(&*self.pool, provider_endpoint)
            .await
    }

    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        provider_endpoint: NewProviderEndpoint,
    ) -> Result<ProviderEndpoint, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let id = provider_endpoint.id.unwrap_or(Ulid::new().to_string());

        sqlx::query_as!(
            ProviderEndpoint,
            "
            INSERT INTO
              provider_endpoints
              (
                id,
                provider_id,
                marketplace_id,
                type,
                display_name,
                path,
                method,
                compatibility,
                request_template,
                json_request_schema,
                json_response_schema,
                json_request_config,
                json_response_config,
                streaming,
                priority,
                json_config
              )
            VALUES
              (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
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
            provider_endpoint.provider_id,
            provider_endpoint.marketplace_id,
            provider_endpoint.r#type,
            provider_endpoint.display_name,
            provider_endpoint.path,
            provider_endpoint.method,
            provider_endpoint.compatibility,
            provider_endpoint.request_template,
            provider_endpoint.json_request_schema,
            provider_endpoint.json_response_schema,
            provider_endpoint.json_request_config,
            provider_endpoint.json_response_config,
            provider_endpoint.streaming,
            provider_endpoint.priority,
            provider_endpoint.json_config,
        )
        .fetch_one(executor)
        .await
    }

    pub async fn create_many_with_executor<'e, E>(
        &self,
        executor: E,
        provider_endpoints: Vec<NewProviderEndpoint>,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        if provider_endpoints.is_empty() {
            return Ok(());
        }

        debug!(
          provider_endpoints = ?provider_endpoints,
          "ProviderEndpointRepository::create_many_with_executor"
        );

        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(
            "
          INSERT INTO
            provider_endpoints
            (
              id,
              provider_id,
              marketplace_id,
              type,
              display_name,
              path,
              method,
              compatibility,
              request_template,
              json_request_schema,
              json_response_schema,
              json_request_config,
              json_response_config,
              streaming,
              priority,
              json_config
            )
          ",
        );

        /*
         * Generate ULIDs without collisions.
         * https://docs.rs/ulid/latest/ulid/struct.Generator.html
         */
        let mut ulid_generator = Generator::new();

        query_builder.push_values(
            provider_endpoints.into_iter().take(BIND_LIMIT / 14),
            |mut b, provider_endpoint| {
                b.push_bind(
                    provider_endpoint
                        .id
                        .unwrap_or(ulid_generator.generate().unwrap().to_string()),
                );
                b.push_bind(provider_endpoint.provider_id);
                b.push_bind(provider_endpoint.marketplace_id);
                b.push_bind(provider_endpoint.r#type);
                b.push_bind(provider_endpoint.display_name);
                b.push_bind(provider_endpoint.path);
                b.push_bind(provider_endpoint.method);
                b.push_bind(provider_endpoint.compatibility);
                b.push_bind(provider_endpoint.request_template);
                b.push_bind(provider_endpoint.json_request_schema);
                b.push_bind(provider_endpoint.json_response_schema);
                b.push_bind(provider_endpoint.json_request_config);
                b.push_bind(provider_endpoint.json_response_config);
                b.push_bind(provider_endpoint.streaming);
                b.push_bind(provider_endpoint.priority);
                b.push_bind(provider_endpoint.json_config);
            },
        );

        query_builder.build().execute(executor).await?;

        Ok(())
    }
}
