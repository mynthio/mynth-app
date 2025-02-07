use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_create_initial_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_workspace_id",
            sql: include_str!("../migrations/002_add_workspace_id.sql"),
            kind: MigrationKind::Up,
        },
        // Add more migrations here as needed
    ]
}
