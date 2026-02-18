# Mynth (Desktop) — Implementation Plan

This is the execution-focused plan. Ongoing ideas / debates belong in `docs/SKETCHPAD.md`.

Task tracking lives in `docs/TASKS.md`.

## Current stack (repo)

- **Desktop shell**: Electrobun (Bun main process + webview renderer)
- **Renderer**: React + Vite
- **Styling**: Tailwind CSS v4 (+ existing UI primitives)
- **Tooling**: TypeScript, OXC lint/format
- **Persistence**:
  - Global: `config.toml` (TOML file, no secrets) — implemented in `src/bun/config/`
  - Workspace: SQLite (Bun) + Drizzle ORM + `drizzle-kit` migrations
    - Query style: `select().from().leftJoin().where()...` (avoid `db.query.*`)
    - Runtime: apply migrations on workspace open / app start

## Guiding principles

- **Local-first**: everything works offline where possible; cloud providers optional.
- **AI SDK as the contract**: store `message.parts` and tool parts compatibly.
- **Branching-first**: message tree is not a bolt-on; it’s the core.
- **Separate concerns**: secrets + network + DB in the main process; renderer uses a typed RPC layer.
- **Simple now, extensible later**: build “spines” (storage, providers, tools, extension registry) early.

## Proposed architecture (high level)

**Main process (Bun, `src/bun/…`)**
- Persistence (SQLite)
- Provider registry + model discovery
- AI execution via Vercel AI SDK (streaming, tools, structured output, image/video)
- Extension host (register tools/commands)
- Secret manager (Keychain integration)

**Renderer (React, `src/mainview/…`)**
- Workspace + chat + folder navigation
- Chat view (linear + branch selection; later full branch map)
- Prompt composer, attachments picker
- Settings pages (app + providers + system prompts + extensions)

**Typed RPC bridge**
- Renderer calls main via a small request/response protocol.
- Streaming responses emitted as events (token chunks, tool calls, image completion).

## Data model (v1)

We keep content in `messages.parts` (JSON serialized string) and put “queryable” metadata in columns.

**Global config (`config.toml`)**
- app settings (theme, behavior, window state)
- recent workspaces (paths + display names)
- extensions enablement + global extension settings (optional)

**Workspace DB**
- `folders` (nested, for chats)
- `chats`
- `chat_membership` (optional if we later support linking chats into multiple folders)
- `messages`
- `message_runs` (one row per model invocation; links to assistant message)
- `assets` (files/images/video references)
- `providers` (one row per configured AI provider profile; scoped per workspace; user can copy providers when creating a new workspace)
- `models` (one row per enabled model, FK to provider)
- `chat_settings` (per-chat model, system prompt, structured output mode)

**Messages table (minimum fields)**
- `id` (UUIDv7 suggested)
- `chat_id`
- `parent_id` (nullable; root message has NULL)
- `role` (`system`/`user`/`assistant`/`tool`)
- `parts` (TEXT; JSON)
- `created_at`, `updated_at`
- `provider_profile_id`, `model_id` (nullable for user messages)
- `tokens_prompt`, `tokens_completion`, `tokens_total` (nullable)
- `latency_ms` (nullable)
- `error` (nullable)

**Branch mechanics**
- Branching comes “for free” with adjacency lists:
  - multiple assistant replies can share the same `parent_id`
  - editing is a new message node, not mutation (we can add “replace” UX later)
- For performance and UX:
  - store a `chat_branch_heads` table or a per-chat `selected_leaf_message_id`
  - compute the active branch path using `WITH RECURSIVE` queries

**Search (later)**
- Add FTS5 table keyed by message id with denormalized text extracted from `parts`.

## Milestones

### M0 — Naming + foundations (1–2 days)
- Decide: Workspace naming + storage layout (workspace-only DB + global config).
- Add docs (this + sketchpad + tasks) and update README to point to them.
- Establish conventions:
  - IDs (UUIDv7 vs ULID)
  - time source and storage (UTC)
  - where workspace data lives on disk

### M1 — Storage layer + workspace/chats/folders (2–4 days)
- Create SQLite schema + migrations (Drizzle migrator).
- Implement CRUD for:
  - workspaces
  - folders (nested)
  - chats (create, rename, move, delete)
- Add minimal UI shell:
  - workspace switcher
  - folder tree + chats list

Deliverable: user can create a workspace and organize chats in folders; persistence works.

### M2 — Message tree (branching) + basic chat UI (3–6 days)
- Implement `messages` CRUD with `parent_id`.
- UI: render a **linear branch** by default (active leaf), with:
  - branch selector at fork points
  - “reply from here” action to create a new branch
  - “show siblings” affordance
- Composer: send user message -> append node.

Deliverable: branching conversations are visible and navigable, persisted.

### M3 — Provider profiles + model discovery (3–6 days)
- Add provider registry supporting multiple profiles per provider.
- Provider schema (`providers` table) supports:
  - `authKind`: `api_key` | `api_key_pair` | `service_account_json` | `none` | `iam_role`
  - `apiKeyId`: primary Keychain reference (API key, service-account JSON, or AWS accessKeyId)
  - `apiSecretId`: secondary Keychain reference (AWS secretAccessKey only)
  - `config` JSON: org/project IDs, region, resource name, custom headers, etc.
  - See `docs/research/ai-sdk-providers-auth-research-prompt.md` for full provider matrix.
- Implement:
  - Ollama discovery (authKind: `none`, baseUrl required)
  - OpenRouter discovery (authKind: `api_key`)
  - Model enable/disable per profile
- Settings UI to manage profiles + pick default model.
  - Form fields driven by `authKind` + `kind` (provider-aware form)

Deliverable: user can add providers, pick models, and choose a chat default model.

### M4 — AI execution via Vercel AI SDK (4–8 days)
- Add “run” pipeline in main process:
  - build AI SDK messages from DB `parts`
  - call `streamText` for chat
  - persist streaming progress (at least final message + run metadata)
- Tool usage MVP:
  - built-in tools (e.g., “open url”, “search workspace” later)
  - support tool call/result parts stored in `parts`
- Store run metadata:
  - provider/model, token usage, timings, tool trace (raw JSON)

Deliverable: real chat completions with streaming + persisted metadata.

### M5 — Images (3–6 days)
- Add image generation pipeline:
  - `generateImage` in main process
  - persist asset and add an image part into the chat
- UI:
  - render inline images in chat
  - add a workspace “Media” gallery view

Deliverable: image generation works and is browsable.

### M6 — Structured outputs (2–5 days)
- Chat setting: “structured output” with JSON schema.
- Execution:
  - generate structured output and store parsed result
- UI:
  - JSON viewer (collapsed/expand)
  - schema editor (raw JSON schema for v1)

Deliverable: schema-driven JSON responses in a chat.

### M7 — Extensions (MVP) (4–10 days)
- Extension registry + manifest format.
- Extension host loads extensions and registers:
  - AI tools (AI SDK tool definitions)
  - commands (exporters, transforms)
- Settings:
  - enable/disable extension
  - show declared permissions/capabilities

Deliverable: third-party code can add tools/commands in a controlled way.

### M8 — Video (experimental) (timeboxed spike)
- Integrate AI SDK experimental video generation behind a feature flag.
- Store video assets + inline preview.

Deliverable: a working prototype; decide whether to ship.

## Early decisions to make (recommended order)

1) **Workspace naming**: Workspace vs Project vs Space vs Vault.
2) **DB layout**: single DB vs per-workspace DB + global DB.
3) **Branch UX**: "linear view + branch selector" first (recommended) vs always showing full tree.
4) **ID format**: UUIDv7 (recommended) for ordering and portability.
5) **Keychain path**: pick a Keychain integration approach and implement a thin `SecretStore` abstraction.

## Decisions made

- **Provider schema**: `providers` table uses `authKind` + `apiKeyId` + `apiSecretId` + `config` JSON.
  Full provider auth research in `docs/research/ai-sdk-providers-auth-research-prompt.md`.
- **Schema**: Initial schema in `src/bun/db/schema.ts` covers folders, chats, messages, assets, providers, models, chat_settings.
- **Global config**: `config.toml` lives at `<AppData>/<appId>/<channel>/config.toml`.
  - Implemented in `src/bun/config/` (`types.ts`, `defaults.ts`, `store.ts`, `index.ts`).
  - Serialization via `smol-toml`; deep-merge patch API (`updateConfig(patch)`).
  - Missing keys fall back to `DEFAULT_CONFIG`; no file = all defaults.
  - Shared path resolution in `src/bun/utils/paths.ts` (used by both config and workspace modules).
  - Current fields: `app.theme` (`"dark"`), `chat.message.fontSize` (`14`).

## Suggested next concrete task

Pick M0 decisions (naming + DB layout), then implement:
- workspace/chats/folders CRUD in main + a basic renderer UI to exercise it
- Drizzle migration for the current schema (M1-T1)
