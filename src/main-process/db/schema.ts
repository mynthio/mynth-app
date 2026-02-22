import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const nowMs = sql`(cast((julianday('now') - 2440587.5) * 86400000 as integer))`;

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // JSON object stored as TEXT in SQLite (parsed by app code).
  settings: text("settings").notNull().default("{}"),
  createdAt: integer("created_at").notNull().default(nowMs),
  updatedAt: integer("updated_at").notNull().default(nowMs),
});

export const folders = sqliteTable(
  "folders",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnySQLiteColumn => folders.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [
    index("folders_workspace_id_idx").on(table.workspaceId),
    index("folders_parent_id_idx").on(table.parentId),
  ],
);

export const chats = sqliteTable(
  "chats",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [
    index("chats_workspace_id_idx").on(table.workspaceId),
    index("chats_folder_id_idx").on(table.folderId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnySQLiteColumn => messages.id, {
      onDelete: "set null",
    }),
    role: text("role").notNull(),
    parts: text("parts").notNull(),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [
    index("messages_chat_id_idx").on(table.chatId),
    index("messages_parent_id_idx").on(table.parentId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    // Explicit workspace scope is required because files live in per-workspace asset directories.
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    chatId: text("chat_id").references(() => chats.id, {
      onDelete: "set null",
    }),
    messageId: text("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull(),
    mimeType: text("mime_type").notNull(),
    // Path relative to the workspace asset directory identified by `workspace_id`.
    relativePath: text("relative_path").notNull(),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    createdAt: integer("created_at").notNull().default(nowMs),
  },
  (table) => [
    index("assets_workspace_id_idx").on(table.workspaceId),
    index("assets_chat_id_idx").on(table.chatId),
    index("assets_message_id_idx").on(table.messageId),
  ],
);

/**
 * Provider profiles — app-global rows shared across workspaces.
 *
 * `kind` identifies the provider type (e.g. "openai", "anthropic", "ollama",
 * "openrouter", "custom_openai_compatible").
 *
 * `authKind` drives which form fields and Keychain items are used:
 *   - "api_key"             — single bearer token / API key (most providers)
 *   - "api_key_pair"        — two secrets, e.g. AWS accessKeyId + secretAccessKey
 *   - "service_account_json"— JSON blob stored as one Keychain item (Google Vertex)
 *   - "none"                — no auth required (Ollama, LM Studio local)
 *   - "iam_role"            — ambient IAM / workload identity; no stored secret
 *
 * `apiKeyId` is a reference to a macOS Keychain item ID (not the secret
 * itself). The actual key is fetched at runtime via SecretStore.
 *   - api_key              → the API key string
 *   - api_key_pair         → the primary key (e.g. AWS accessKeyId)
 *   - service_account_json → the full service-account JSON blob
 *   - none / iam_role      → null
 *
 * `apiSecretId` is a secondary Keychain item reference used only for
 * `api_key_pair` providers (e.g. AWS secretAccessKey stored separately).
 *
 * `baseUrl` is optional; used for self-hosted / custom-endpoint providers
 * (e.g. Ollama at http://localhost:11434).
 *
 * `config` holds provider-specific non-secret fields as JSON:
 * org/project IDs, region, resource name, custom headers, etc.
 *
 * Workspace-specific enable/disable state lives in `workspace_provider_overrides`.
 */
export const providers = sqliteTable(
  "providers",
  {
    id: text("id").primaryKey(),
    // Human-readable label chosen by the user (e.g. "My OpenRouter account").
    displayName: text("display_name").notNull(),
    // Provider type slug — drives which AI SDK adapter to use.
    kind: text("kind").notNull(),
    // Auth method — drives which form fields / Keychain items to use.
    // Values: 'api_key' | 'api_key_pair' | 'service_account_json' | 'none' | 'iam_role'
    authKind: text("auth_kind").notNull().default("api_key"),
    // Optional base URL override (Ollama, LM Studio, custom OpenAI-compatible).
    baseUrl: text("base_url"),
    // Keychain item ID for the primary secret — null for no-auth providers.
    apiKeyId: text("api_key_id"),
    // Keychain item ID for the secondary secret (api_key_pair only).
    // e.g. AWS secretAccessKey stored separately from accessKeyId.
    apiSecretId: text("api_secret_id"),
    // Arbitrary provider-specific config stored as JSON (headers, org ID, region, etc.).
    config: text("config").notNull().default("{}"),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [index("providers_kind_idx").on(table.kind)],
);

export const models = sqliteTable(
  "models",
  {
    // App-wide unique model reference ID (used everywhere in our app).
    id: text("id").primaryKey(),
    // FK to the provider profile that owns this model entry.
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    // Provider-native model identifier used in API calls (e.g. "gpt-4o", "claude-3-5-sonnet-20241022").
    providerModelId: text("provider_model_id").notNull(),
    // Internal cross-provider identity for grouping semantically equivalent models.
    canonicalModelId: text("canonical_model_id").notNull(),
    displayName: text("display_name"),
    // Workspace-specific enable/disable state lives in `workspace_model_overrides`.
    metadata: text("metadata").notNull().default("{}"),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [
    uniqueIndex("models_provider_model_unique").on(table.providerId, table.providerModelId),
    index("models_canonical_model_id_idx").on(table.canonicalModelId),
    index("models_provider_id_idx").on(table.providerId),
  ],
);

export const workspaceProviderOverrides = sqliteTable(
  "workspace_provider_overrides",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [
    primaryKey({
      columns: [table.workspaceId, table.providerId],
    }),
  ],
);

export const workspaceModelOverrides = sqliteTable(
  "workspace_model_overrides",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").notNull().default(nowMs),
    updatedAt: integer("updated_at").notNull().default(nowMs),
  },
  (table) => [
    primaryKey({
      columns: [table.workspaceId, table.modelId],
    }),
  ],
);

export const chatSettings = sqliteTable("chat_settings", {
  chatId: text("chat_id")
    .primaryKey()
    .references(() => chats.id, { onDelete: "cascade" }),
  // FK to the selected model; null means "use workspace/app default".
  modelId: text("model_id").references(() => models.id, {
    onDelete: "set null",
  }),
  systemPrompt: text("system_prompt"),
  outputMode: text("output_mode").notNull().default("text"),
  outputSchema: text("output_schema"),
  updatedAt: integer("updated_at").notNull().default(nowMs),
});
