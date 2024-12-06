use serde::Serialize;

#[derive(Serialize)]
pub struct ChatListItem {
    pub id: i64,
    pub name: String,
}
