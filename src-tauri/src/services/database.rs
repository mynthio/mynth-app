use crate::models::chat::ChatListItem;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new().connect(database_url).await?;

        Ok(Self { pool })
    }

    pub async fn fetch_chats(&self) -> Result<Vec<ChatListItem>, sqlx::Error> {
        sqlx::query_as!(
            ChatListItem,
            "SELECT id, name FROM chats ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }
}
