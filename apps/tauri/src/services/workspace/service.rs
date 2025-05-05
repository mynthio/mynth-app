use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};

use super::dtos::Workspace;

#[derive(Clone)]
pub struct WorkspaceService {
    pool: Arc<SqlitePool>,
}

impl WorkspaceService {
    /// Create a new workspace service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// Get all workspaces
    pub async fn get_all(&self) -> Result<Vec<Workspace>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool).await
    }

    /// Get all workspaces with a specified executor
    pub async fn get_all_with_executor<'e, E>(
        &self,
        executor: E,
    ) -> Result<Vec<Workspace>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Workspace, "SELECT * FROM workspaces")
            .fetch_all(executor)
            .await
    }

    /// Get a workspace by id
    pub async fn get(&self, id: &str) -> Result<Option<Workspace>, sqlx::Error> {
        self.get_with_executor(&*self.pool, id).await
    }

    /// Get a workspace by id with a specified executor
    pub async fn get_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
    ) -> Result<Option<Workspace>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Workspace, "SELECT * FROM workspaces WHERE id = ?", id)
            .fetch_optional(executor)
            .await
    }
}
