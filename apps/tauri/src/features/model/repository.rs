use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::{Generator, Ulid};

use super::dtos::{Model, NewModel, UpdateModel};

const BIND_LIMIT: usize = 32766;

#[derive(Clone)]
pub struct ModelRepository {
    pool: Arc<SqlitePool>,
}

impl ModelRepository {
    /// Create a new chat node message service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get(&self, model_id: &str) -> Result<Model, sqlx::Error> {
        self.get_with_executor(model_id, &*self.pool).await
    }

    pub async fn get_with_executor<'e, E>(
        &self,
        model_id: &str,
        executor: E,
    ) -> Result<Model, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Model, "SELECT * FROM models WHERE id = ?", model_id)
            .fetch_one(executor)
            .await
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

    pub async fn create_many_with_executor<'e, E>(
        &self,
        executor: E,
        models: Vec<NewModel>,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        if models.is_empty() {
            return Ok(());
        }

        debug!(
          models = ?models,
          "ModelRepository::create_many_with_executor"
        );

        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(
            "
          INSERT INTO
            models
            (
              id,
              provider_id,
              name,
              marketplace_id,
              display_name,
              max_input_tokens,
              input_price,
              output_price,
              tags,
              source,
              is_hidden,
              request_template,
              json_config,
              json_metadata_v1
            )
          ",
        );

        /*
         * Generate ULIDs without collisions.
         * https://docs.rs/ulid/latest/ulid/struct.Generator.html
         */
        let mut ulid_generator = Generator::new();

        query_builder.push_values(models.into_iter().take(BIND_LIMIT / 11), |mut b, model| {
            b.push_bind(
                model
                    .id
                    .unwrap_or(ulid_generator.generate().unwrap().to_string()),
            );
            b.push_bind(model.name);
            b.push_bind(model.marketplace_id);
            b.push_bind(model.display_name);
            b.push_bind(model.max_input_tokens);
            b.push_bind(model.input_price);
            b.push_bind(model.output_price);
            b.push_bind(model.tags);
            b.push_bind(model.source);
            b.push_bind(model.is_hidden);
            b.push_bind(model.request_template);
            b.push_bind(model.json_config);
            b.push_bind(model.json_metadata_v1);
        });

        query_builder
            .build()
            .execute(executor)
            .await
            .inspect_err(|e| debug!(error = ?e, "Error"))?;

        Ok(())
    }

    pub async fn update(&self, model: UpdateModel) -> Result<(), sqlx::Error> {
        self.update_with_executor(&*self.pool, model).await
    }

    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        update: UpdateModel,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE models SET ");

        let mut separated = query_builder.separated(", ");

        if let Some(marketplace_id) = update.marketplace_id {
            separated.push("marketplace_id = ");
            separated.push_bind_unseparated(marketplace_id);
        }

        if let Some(provider_id) = update.provider_id {
            separated.push("provider_id = ");
            separated.push_bind_unseparated(provider_id);
        }

        if let Some(name) = update.name {
            separated.push("name = ");
            separated.push_bind_unseparated(name);
        }

        if let Some(display_name) = update.display_name {
            separated.push("display_name = ");
            separated.push_bind_unseparated(display_name);
        }

        if let Some(max_input_tokens) = update.max_input_tokens {
            separated.push("max_input_tokens = ");
            separated.push_bind_unseparated(max_input_tokens);
        }

        if let Some(input_price) = update.input_price {
            separated.push("input_price = ");
            separated.push_bind_unseparated(input_price);
        }

        if let Some(output_price) = update.output_price {
            separated.push("output_price = ");
            separated.push_bind_unseparated(output_price);
        }

        if let Some(tags) = update.tags {
            separated.push("tags = ");
            separated.push_bind_unseparated(tags);
        }

        if let Some(source) = update.source {
            separated.push("source = ");
            separated.push_bind_unseparated(source);
        }

        if let Some(is_hidden) = update.is_hidden {
            separated.push("is_hidden = ");
            separated.push_bind_unseparated(is_hidden);
        }

        if let Some(is_favourite) = update.is_favourite {
            separated.push("is_favourite = ");
            separated.push_bind_unseparated(is_favourite);
        }

        if let Some(capabilities) = update.capabilities {
            separated.push("capabilities = ");
            separated.push_bind_unseparated(capabilities);
        }

        if let Some(is_pinned) = update.is_pinned {
            separated.push("is_pinned = ");
            separated.push_bind_unseparated(is_pinned);
        }

        if let Some(request_template) = update.request_template {
            separated.push("request_template = ");
            separated.push_bind_unseparated(request_template);
        }

        if let Some(json_config) = update.json_config {
            separated.push("json_config = ");
            separated.push_bind_unseparated(json_config);
        }

        if let Some(json_metadata_v1) = update.json_metadata_v1 {
            separated.push("json_metadata_v1 = ");
            separated.push_bind_unseparated(json_metadata_v1);
        }

        if let Some(json_variables) = update.json_variables {
            separated.push("json_variables = ");
            separated.push_bind_unseparated(json_variables);
        }

        query_builder.push(" WHERE id = ");
        query_builder.push_bind(update.id);

        query_builder.build().execute(executor).await?;

        Ok(())
    }
}
