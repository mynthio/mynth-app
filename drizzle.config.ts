import { defineConfig } from "drizzle-kit";

const drizzleDbPath = process.env["DRIZZLE_DB_PATH"] ?? "./tmp/drizzle-workspace-dev.sqlite";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main-process/db/schema.ts",
  out: "./src/main-process/db/migrations",
  dbCredentials: {
    url: drizzleDbPath,
  },
  strict: true,
  verbose: true,
});
