use sqlx::QueryBuilder;
use sqlx::Sqlite;
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

use super::database::DbPool;
use crate::models::chat::{ChatFolder, UpdateFolderParams};

pub struct ChatFolderService {
    pool: Arc<DbPool>,
}

impl ChatFolderService {
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }

    pub async fn fetch_all(&self, workspace_id: Option<String>) -> sqlx::Result<Vec<ChatFolder>> {
        sqlx::query_as!(
            ChatFolder,
            r#"
            SELECT 
                id,
                name,
                parent_id,
                workspace_id
            FROM chat_folders
            WHERE (? IS NULL AND workspace_id IS NULL) OR workspace_id = ?
            ORDER BY parent_id NULLS FIRST, name
            "#,
            workspace_id,
            workspace_id,
        )
        .fetch_all(self.pool.get())
        .await
    }

    pub async fn update_folder(
        &self,
        folder_id: String,
        params: UpdateFolderParams,
    ) -> sqlx::Result<()> {
        info!(
            "Updating folder with id: {}, params: {:?}",
            folder_id, params
        );

        let mut query_builder = QueryBuilder::new("UPDATE chat_folders SET ");
        let mut separated = query_builder.separated(", ");

        if let Some(name) = params.name {
            separated.push("name = ").push_bind_unseparated(name);
        }

        if let Some(parent_id) = params.parent_id {
            if parent_id == folder_id {
                error!("Cannot set folder as its own parent: {}", folder_id);
                return Err(sqlx::Error::Protocol(
                    "Cannot set folder as its own parent".into(),
                ));
            }
            separated
                .push("parent_id = ")
                .push_bind_unseparated(parent_id);
        }

        separated.push(" updated_at = CURRENT_TIMESTAMP");
        query_builder
            .push(" WHERE id = ")
            .push_bind(folder_id.clone());

        info!("Executing query: {}", query_builder.sql());
        let query = query_builder.build();

        if let Err(err) = query.execute(self.pool.get()).await {
            error!("Failed to execute folder update query: {}", err);
            return Err(err);
        }

        info!("Successfully completed folder update for id: {}", folder_id);
        Ok(())
    }

    pub async fn create_folder(
        &self,
        name: &str,
        parent_id: Option<String>,
        workspace_id: Option<String>,
    ) -> sqlx::Result<String> {
        let id = format!("folder-{}", Uuid::new_v4());
        // ... existing code ...
        Ok(id)
    }

    pub async fn get_chat_folders(
        &self,
        workspace_id: String,
        parent_id: Option<String>,
    ) -> sqlx::Result<Vec<ChatFolder>> {
        // Build query based on parent_id parameter
        if let Some(parent) = &parent_id {
            // If parent_id is provided (could be null or a specific ID)
            sqlx::query_as!(
                ChatFolder,
                r#"
                SELECT 
                    id,
                    name,
                    parent_id,
                    workspace_id
                FROM chat_folders
                WHERE workspace_id = ? AND 
                      ((?2 IS NULL AND parent_id IS NULL) OR parent_id = ?2)
                ORDER BY name
                "#,
                workspace_id,
                parent
            )
            .fetch_all(self.pool.get())
            .await
        } else {
            // If parent_id is not provided at all, don't filter by parent
            sqlx::query_as!(
                ChatFolder,
                r#"
                SELECT 
                    id,
                    name,
                    parent_id,
                    workspace_id
                FROM chat_folders
                WHERE workspace_id = ?
                ORDER BY name
                "#,
                workspace_id
            )
            .fetch_all(self.pool.get())
            .await
        }
    }
}
