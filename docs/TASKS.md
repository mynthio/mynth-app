# Mynth — Tasks (repo tracker)

This is the lightweight, repo-local ticket system. We can migrate/sync to Linear later if/when we want.

## Status tags

- `BACKLOG` — good idea, not scheduled
- `NEXT` — queued up
- `IN_PROGRESS` — actively being built
- `BLOCKED` — waiting on a decision/spike
- `DONE` — shipped/merged

## How to use

- Each ticket is a small, mergeable slice (ideally ≤1–2 days).
- Prefer adding **Acceptance** bullets (binary "done / not done").
- Keep cross-ticket dependencies explicit.

## M0 — Foundations

### M0-T1 — Workspace on-disk spec
- Status: `NEXT`
- Goal: Define workspace folder layout (DB + assets) and export/backup story.
- Acceptance:
  - A single documented layout under `Utils.paths.userData` (default)
  - Workspace export = copying one folder (no secrets)

### M0-T2 — Global config file (`config.toml`)
- Status: `DONE`
- Goal: Define and implement a global TOML config file with typed access.
- Notes:
  - Implemented in `src/bun/config/` (`types.ts`, `defaults.ts`, `store.ts`, `index.ts`).
  - Serialization via `smol-toml`; deep-merge patch API (`updateConfig(patch)`).
  - Path: `<AppData>/<appId>/<channel>/config.toml`; override via `MYNTH_CONFIG_PATH`.
  - Shared path resolution extracted to `src/bun/utils/paths.ts`.
- Acceptance:
  - Config loads on app start; missing file falls back to defaults ✓
  - `getConfig()` / `updateConfig(patch)` / `reloadConfig()` API ✓
  - Current fields: `app.theme`, `chat.message.fontSize` ✓
  - No secrets stored ✓
  - Example file documented in `src/bun/config/config.toml.example` ✓

### M0-T3 — ID + time conventions
- Status: `NEXT`
- Goal: Standardize IDs + timestamps.
- Acceptance:
  - IDs: UUIDv7 everywhere (documented)
  - Timestamps: UTC ms epoch (documented)

### M0-T4 — DB stack decision + scaffolding (Drizzle + Bun SQLite)
- Status: `DONE`
- Goal: Establish the workspace DB access pattern and migrations workflow.
- Notes:
  - Use Drizzle ORM with Bun SQLite for DB access.
  - Use Drizzle's SQL-like query builder (`select().from().where()...`), not the relational `db.query.*` API.
  - Use `drizzle-kit` to generate migrations and Drizzle migrator to apply them on user machines.
- Acceptance:
  - `drizzle.config.*` present and runnable via Bun scripts ✓
  - A "hello migration" runs against a local workspace DB ✓

### M0-T5 — Spike: Keychain `SecretStore`
- Status: `BLOCKED` (until we pick approach)
- Goal: Decide the best way to read/write macOS Keychain from Electrobun/Bun.
- Acceptance:
  - Recommended implementation path + fallback path
  - `SecretStore` API shape agreed (get/set/delete/list)

### M0-T6 — Spike: AI SDK in Bun main process
- Status: `NEXT`
- Goal: Validate streaming + tools + parts persistence with Vercel AI SDK.
- Acceptance:
  - Notes on recommended message/parts mapping
  - Proof that streaming events can be forwarded to renderer reliably

### M0-T7 — Spike: AI SDK provider auth methods research
- Status: `DONE`
- Goal: Research how each Vercel AI SDK provider is configured and what auth fields are needed.
- Notes:
  - Full research report: `docs/research/ai-sdk-providers-auth-research-prompt.md`
- Acceptance:
  - Provider matrix covering all official `@ai-sdk/*` packages ✓
  - Schema recommendations documented ✓
  - `providers` table updated with `authKind` + `apiSecretId` columns ✓

## M1 — Workspace DB + migrations

### M1-T1 — Workspace DB migrations runner (Drizzle)
- Status: `NEXT`
- Goal: Apply `drizzle-kit` migrations on workspace open / app start using Drizzle migrator.
- Acceptance:
  - Migrations table used consistently
  - Idempotent open/create workspace DB
  - Packaged app can still find and apply migration files

### M1-T2 — Schema v1: folders/chats/messages/assets/providers/models/settings
- Status: `IN_PROGRESS`
- Goal: Create initial schema aligned with message tree + AI SDK `parts` + provider profiles.
- Notes:
  - Schema defined in `src/bun/db/schema.ts`
  - Provider auth design: see `docs/research/ai-sdk-providers-auth-research-prompt.md`
- Acceptance:
  - `messages(parent_id)` supports branching ✓
  - `messages.parts` is TEXT JSON ✓
  - `providers` table has `authKind`, `apiKeyId`, `apiSecretId`, `config` ✓
  - `models` table FK to `providers` ✓
  - `message_runs` captures provider/model/tokens/latency/error (pending)
  - Drizzle migration generated and applied

### M1-T3 — Workspace CRUD in main process
- Status: `BACKLOG`
- Goal: Create/open/list/delete workspaces, manage paths.
- Acceptance:
  - Create workspace produces folder + `workspace.sqlite` + `assets/`
  - Open workspace validates schema version and migrates if needed

## M2 — Chat UI (no AI)

### M2-T1 — Sidebar: folders + chats
- Status: `BACKLOG`
- Acceptance:
  - Create/rename/delete folder and chat
  - Move chats between folders (nested)

### M2-T2 — Chat view v1: linear branch + branch selector
- Status: `BACKLOG`
- Acceptance:
  - Active branch renders as a simple list
  - Fork points show arrows + "branch count"
  - "Reply from here" creates a new child branch

### M2-T3 — Composer v1
- Status: `BACKLOG`
- Acceptance:
  - Submit creates a `user` message node with `parts=[{type:'text',text:...}]`

## M3 — Providers (workspace-only)

### M3-T1 — Provider profiles table + UI
- Status: `BACKLOG`
- Notes:
  - Auth design finalized: `authKind` drives form fields; see `docs/research/ai-sdk-providers-auth-research-prompt.md`
- Acceptance:
  - Add/edit/remove provider profiles in a workspace
  - Supports at minimum: Ollama (`authKind: none`), OpenRouter (`authKind: api_key`)
  - Settings form is provider-aware (shows correct fields per `authKind` + `kind`)
  - Secrets stored as Keychain references only (`apiKeyId`, `apiSecretId`)

### M3-T2 — Model discovery + enable/disable models
- Status: `BACKLOG`
- Acceptance:
  - Fetch models list per provider profile
  - Persist enabled set; hide disabled in model picker

## M4 — AI runs (Vercel AI SDK)

### M4-T1 — Stream chat completion to renderer
- Status: `BACKLOG`
- Acceptance:
  - `streamText` produces live tokens in UI
  - Final assistant message persisted with `parts`
  - Run metadata saved on completion

### M4-T2 — Tool calls MVP
- Status: `BACKLOG`
- Acceptance:
  - Tool call/result parts persisted in `messages.parts`
  - Tool trace visible in a debug/details panel

## M5 — Images

### M5-T1 — Image generation + asset persistence
- Status: `BACKLOG`
- Acceptance:
  - Generates image and stores under `assets/`
  - Adds image part to chat

### M5-T2 — Media gallery view
- Status: `BACKLOG`

## M6 — Structured outputs

### M6-T1 — Per-chat JSON schema setting
- Status: `BACKLOG`

### M6-T2 — Persist parsed JSON result
- Status: `BACKLOG`

## M7 — Extensions (MVP)

### M7-T1 — Extension registry (global config) + workspace settings
- Status: `BACKLOG`

### M7-T2 — "Extensions as tools/commands" host
- Status: `BACKLOG`
