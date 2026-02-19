import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./schema";

export type WorkspaceDatabase = BetterSQLite3Database<typeof schema>;
const moduleDir = dirname(fileURLToPath(import.meta.url));

function resolveMigrationsFolder(): string {
  const candidates = [
    join(moduleDir, "migrations"),
    join(moduleDir, "db", "migrations"),
    join(process.cwd(), "src", "bun", "db", "migrations"),
  ];
  if (process.resourcesPath) {
    candidates.push(join(process.resourcesPath, "migrations"));
    candidates.push(join(process.resourcesPath, "src", "bun", "db", "migrations"));
  }

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

  const sqlite = new Database(dbPath);
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
