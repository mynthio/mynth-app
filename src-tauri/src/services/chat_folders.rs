use sqlx::Pool;
use sqlx::Sqlite;

use crate::models::chat::ChatFolder;

pub struct ChatFoldersService {
    pool: Pool<Sqlite>,
}

impl ChatFoldersService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn fetch_all(&self) -> sqlx::Result<Vec<ChatFolder>> {
        sqlx::query_as!(
            ChatFolder,
            r#"
            SELECT 
                id,
                name,
                parent_id
            FROM chat_folders
            ORDER BY parent_id NULLS FIRST, name
            "#
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_name(&self, folder_id: i64, new_name: String) -> sqlx::Result<()> {
        sqlx::query!(
            "UPDATE chat_folders SET name = ? WHERE id = ?",
            new_name,
            folder_id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
