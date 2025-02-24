use sqlx::Pool;
use sqlx::QueryBuilder;
use sqlx::Sqlite;
use tracing::{error, info};

use crate::models::chat::{ChatFolder, UpdateFolderParams};

pub struct ChatFolderService {
    pool: Pool<Sqlite>,
}

impl ChatFolderService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
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
        .fetch_all(&self.pool)
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

        if let Err(err) = query.execute(&self.pool).await {
            error!("Failed to execute folder update query: {}", err);
            return Err(err);
        }

        info!("Successfully completed folder update for id: {}", folder_id);
        Ok(())
    }
}
