import Database from "better-sqlite3";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import * as schema from "./schema";

export type WorkspaceDatabase = BetterSQLite3Database<typeof schema>;

const _require = createRequire(import.meta.url);

// Long-lived connections keyed by absolute DB path, reused across IPC calls.
const connections = new Map<string, { sqlite: BetterSqliteDatabase; db: WorkspaceDatabase }>();

function resolveMigrationsFolder(): string {
  if (process.versions.electron) {
    const { app } = _require("electron") as typeof import("electron");

    if (app.isPackaged) {
      // Packaged Electron app — migrations come from extraResource in forge.config.ts.
      return join(process.resourcesPath, "migrations");
    }

    // Development Electron — app.getAppPath() is the reliable project root
    // (process.cwd() can shift depending on how the process was launched).
    return join(app.getAppPath(), "src", "main-process", "db", "migrations");
  }

  // CLI (studio) or any non-Electron context.
  return join(process.cwd(), "src", "main-process", "db", "migrations");
}

function openDatabase(dbPath: string): { sqlite: BetterSqliteDatabase; db: WorkspaceDatabase } {
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath) as BetterSqliteDatabase;
  sqlite.exec("PRAGMA foreign_keys = ON;");
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA synchronous = NORMAL;"); // Safe with WAL, much faster than FULL
  sqlite.exec("PRAGMA busy_timeout = 5000;"); // Wait up to 5s before SQLITE_BUSY error
  sqlite.exec("PRAGMA cache_size = -20000;"); // 20 MB page cache
  sqlite.exec("PRAGMA temp_store = MEMORY;"); // Temp tables and indices in memory

  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

export function migrateDatabaseFile(dbPath: string): void {
  const { sqlite, db } = openDatabase(dbPath);

  try {
    migrate(db, { migrationsFolder: resolveMigrationsFolder() });
  } finally {
    sqlite.close();
  }
}

/**
 * Returns a long-lived Drizzle connection for the given workspace DB path,
 * opening it on first access. Reuse this for all IPC query handlers.
 */
export function getOrOpenDatabase(dbPath: string): WorkspaceDatabase {
  let entry = connections.get(dbPath);
  if (!entry) {
    entry = openDatabase(dbPath);
    connections.set(dbPath, entry);
  }
  return entry.db;
}

/**
 * Closes all open SQLite connections. Call this from the `before-quit`
 * app event to ensure WAL checkpointing completes cleanly.
 */
export function closeAllDatabases(): void {
  for (const { sqlite } of connections.values()) {
    sqlite.close();
  }
  connections.clear();
}
