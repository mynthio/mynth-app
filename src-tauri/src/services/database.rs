use super::ai::AiService;
use super::chat::ChatService;
use super::chat_folder::ChatFolderService;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

pub struct Database {
    pub folders: ChatFolderService,
    pub chats: ChatService,
    pub ai: AiService,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new().connect(database_url).await?;
        let folders = ChatFolderService::new(pool.clone());
        let chats = ChatService::new(pool.clone());
        let ai = AiService::new(pool.clone());

        Ok(Self { folders, chats, ai })
    }
}
