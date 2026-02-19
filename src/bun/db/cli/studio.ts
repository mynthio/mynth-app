import { ensureWorkspaceDatabase, listWorkspaceIds } from "../index";
import { spawn } from "node:child_process";

function getWorkspaceIdFromArgv(): string | undefined {
  const args = process.argv.slice(2);
  return args.find((arg) => !arg.startsWith("-"));
}

const workspaceId = getWorkspaceIdFromArgv();

if (!workspaceId) {
  const discoveredIds = listWorkspaceIds();
  const discoveredMessage = discoveredIds.length > 0 ? discoveredIds.join(", ") : "(none)";

  console.error("Usage: bun run db:studio -- <workspace-id>");
  console.error(`Discovered workspace IDs: ${discoveredMessage}`);
  process.exit(1);
}

const workspacePaths = ensureWorkspaceDatabase(workspaceId);
console.log(`Launching Drizzle Studio for workspace "${workspaceId}"`);
console.log(`SQLite DB path: ${workspacePaths.dbPath}`);

const env: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (value !== undefined) {
    env[key] = value;
  }
}
env["DRIZZLE_DB_PATH"] = workspacePaths.dbPath;

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const drizzleKitProcess = spawn(
  command,
  ["exec", "drizzle-kit", "studio", "--config=drizzle.config.ts"],
  {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  },
);

drizzleKitProcess.on("exit", (code) => {
  process.exit(code ?? 0);
});
