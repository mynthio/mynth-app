use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};

use super::dtos::Folder;

#[derive(Clone)]
pub struct FolderService {
    pool: Arc<SqlitePool>,
}

impl FolderService {
    /// Create a new folder service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// Find all folders by parent id
    pub async fn find_all_by_parent_id(
        &self,
        workspace_id: &str,
        parent_id: Option<&str>,
    ) -> Result<Vec<Folder>, sqlx::Error> {
        self.find_all_by_parent_id_with_executor(&*self.pool, workspace_id, parent_id)
            .await
    }

    /// Find all folders by parent id with a specified executor
    pub async fn find_all_by_parent_id_with_executor<'e, E>(
        &self,
        executor: E,
        workspace_id: &str,
        parent_id: Option<&str>,
    ) -> Result<Vec<Folder>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(
            Folder,
            "
              SELECT * 
              FROM folders 
              WHERE 
                workspace_id = ? 
                AND parent_id = ?",
            workspace_id,
            parent_id
        )
        .fetch_all(executor)
        .await
    }
}
