import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import * as schema from "./schema";

export type WorkspaceDatabase = BunSQLiteDatabase<typeof schema>;

function resolveMigrationsFolder(): string {
  const candidates = [
    join(import.meta.dir, "migrations"),
    join(import.meta.dir, "db", "migrations"),
    join(process.cwd(), "src", "bun", "db", "migrations"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "meta", "_journal.json"))) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate Drizzle migrations folder. Checked: ${candidates.join(", ")}`,
  );
}

function openDatabase(dbPath: string): {
  sqlite: Database;
  db: WorkspaceDatabase;
} {
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath, { create: true });
  sqlite.run("PRAGMA foreign_keys = ON;");
  sqlite.run("PRAGMA journal_mode = WAL;");

  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

export function migrateDatabaseFile(dbPath: string): void {
  const { sqlite, db } = openDatabase(dbPath);

  try {
    migrate(db, {
      migrationsFolder: resolveMigrationsFolder(),
    });
  } finally {
    sqlite.close();
  }
}
