use sqlx::Pool;
use sqlx::QueryBuilder;
use sqlx::Sqlite;
use tracing::{error, info};

use super::chat_folder::ChatFolderService;
use crate::models::chat::{ChatListItem, FlatItem, UpdateChatParams};

pub struct ChatService {
    pool: Pool<Sqlite>,
    folders: ChatFolderService,
}

impl ChatService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        let folders = ChatFolderService::new(pool.clone());
        Self { pool, folders }
    }

    pub async fn fetch_chats(
        &self,
        workspace_id: Option<String>,
    ) -> sqlx::Result<Vec<ChatListItem>> {
        sqlx::query_as!(
            ChatListItem,
            r#"
            SELECT id, name, parent_id, workspace_id, updated_at 
            FROM chats 
            WHERE (? IS NULL AND workspace_id IS NULL) OR workspace_id = ?
            ORDER BY updated_at DESC
            "#,
            workspace_id,
            workspace_id,
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn fetch_flat_structure(
        &self,
        workspace_id: Option<String>,
    ) -> sqlx::Result<Vec<FlatItem>> {
        let folders = self.folders.fetch_all(workspace_id.clone()).await?;
        let chats = self.fetch_chats(workspace_id).await?;

        let mut items = Vec::new();
        items.extend(folders.into_iter().map(FlatItem::Folder));
        items.extend(chats.into_iter().map(FlatItem::Chat));

        Ok(items)
    }

    pub async fn update_chat(&self, chat_id: &str, params: UpdateChatParams) -> sqlx::Result<()> {
        info!("Updating chat with id: {}, params: {:?}", chat_id, params);

        let mut query_builder = QueryBuilder::new("UPDATE chats SET ");
        let mut separated = query_builder.separated(", ");

        if let Some(name) = params.name {
            separated.push("name = ").push_bind_unseparated(name);
        }

        if let Some(parent_id) = params.parent_id {
            separated
                .push("parent_id = ")
                .push_bind_unseparated(parent_id);
        }

        separated.push(" updated_at = CURRENT_TIMESTAMP");
        query_builder.push(" WHERE id = ").push_bind(chat_id);

        info!("Executing query: {}", query_builder.sql());
        let query = query_builder.build();

        if let Err(err) = query.execute(&self.pool).await {
            error!("Failed to execute chat update query: {}", err);
            return Err(err);
        }

        info!("Successfully completed chat update for id: {}", chat_id);
        Ok(())
    }
}
