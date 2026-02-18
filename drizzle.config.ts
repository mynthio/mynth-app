import { defineConfig } from "drizzle-kit";

const drizzleDbPath = process.env["DRIZZLE_DB_PATH"] ?? "./tmp/drizzle-workspace-dev.sqlite";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/bun/db/schema.ts",
  out: "./src/bun/db/migrations",
  dbCredentials: {
    url: drizzleDbPath,
  },
  strict: true,
  verbose: true,
});
