use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::Ulid;

use super::dtos::{Branch, NewBranch, UpdateBranch};

pub struct BranchRepository {
    pool: Arc<SqlitePool>,
}

impl BranchRepository {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get(&self, branch_id: &str) -> Result<Branch, sqlx::Error> {
        self.get_with_executor(&*self.pool, branch_id).await
    }

    pub async fn get_with_executor<'e, E>(
        &self,
        executor: E,
        branch_id: &str,
    ) -> Result<Branch, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(branch_id = branch_id, "BranchRepository::get");

        sqlx::query_as!(Branch, "SELECT * FROM branches WHERE id = ?", branch_id)
            .fetch_one(executor)
            .await
    }

    pub async fn get_all_by_chat_id(&self, chat_id: &str) -> Result<Vec<Branch>, sqlx::Error> {
        self.get_all_by_chat_id_with_executor(&*self.pool, chat_id)
            .await
    }

    pub async fn get_all_by_chat_id_with_executor<'e, E>(
        &self,
        executor: E,
        chat_id: &str,
    ) -> Result<Vec<Branch>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(chat_id = chat_id, "BranchRepository::find_all_by_chat_id");

        sqlx::query_as!(Branch, "SELECT * FROM branches WHERE chat_id = ?", chat_id)
            .fetch_all(executor)
            .await
    }

    /// Create a new branch
    pub async fn create(&self, branch: NewBranch) -> Result<Branch, sqlx::Error> {
        self.create_with_executor(&*self.pool, branch).await
    }

    /// Create a new branch with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        branch: NewBranch,
    ) -> Result<Branch, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(
            chat_id = branch.chat_id,
            parent_id = branch.parent_id,
            "BranchRepository::create"
        );

        let id = branch.id.unwrap_or_else(|| Ulid::new().to_string());

        let created_branch = sqlx::query_as!(
            Branch,
            "
            INSERT INTO branches 
            (
                id,
                chat_id,
                name,
                parent_id,
                model_id
            ) 
            VALUES 
            (
                ?, 
                ?,
                ?,
                ?,
                ?
            )
            RETURNING *
        ",
            id,
            branch.chat_id,
            branch.name,
            branch.parent_id,
            branch.model_id
        )
        .fetch_one(executor)
        .await?;

        Ok(created_branch)
    }

    /// Update a branch
    pub async fn update(&self, branch: UpdateBranch) -> Result<Branch, sqlx::Error> {
        self.update_with_executor(&*self.pool, branch).await
    }

    /// Update a branch with a specified executor
    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        branch: UpdateBranch,
    ) -> Result<Branch, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(branch_id = branch.id, "BranchRepository::update");

        // Initialize QueryBuilder for SQLite
        let mut query_builder: QueryBuilder<sqlx::Sqlite> =
            QueryBuilder::new("UPDATE branches SET ");

        // Build the SET clause dynamically
        let mut separated = query_builder.separated(", ");

        if let Some(name) = branch.name {
            separated.push("name = ");
            separated.push_bind_unseparated(name);
        }

        if let Some(model_id) = branch.model_id {
            separated.push("model_id = ");
            separated.push_bind_unseparated(model_id);
        }

        // Add WHERE clause and RETURNING clause
        query_builder
            .push(" WHERE id = ")
            .push_bind(branch.id)
            .push(" RETURNING *");

        // Prepare the query
        let query = query_builder.build_query_as::<Branch>();

        // Execute the query and map to Branch struct
        let branch = query.fetch_one(executor).await?;

        Ok(branch)
    }
}
