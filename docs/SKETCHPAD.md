# Mynth (Desktop) — Sketchpad

This document is intentionally “messy”: ideas, assumptions, open questions, and design notes. The concrete execution plan lives in `docs/PLAN.md`.

## Product snapshot

**What we’re building**
- A desktop AI chat app with:
  - Multi-provider LLM chat (cloud now; local also, starting with Ollama)
  - Tool usage (first-party and extension-provided tools)
  - Image generation (v1), with an option to include video generation later
- Vercel AI SDK is the contract layer for providers, streaming, tools, and message `parts`.

**Core workflow**
- Users have **Workspaces** (name TBD).
- Each workspace contains **Chats**, organized in **nested folders**.
- Each chat is a **tree of messages** (branching supported) using `parentId` adjacency.

**Non-goals for now**
- Exhaustive sampling knobs (`topK`, etc.) beyond basics.
- Perfect UI/UX and theming (we’ll keep UI simple initially).
- Complex collaboration/sync (single-device local-first first).

## Terminology (proposed)

- **Workspace**: Top-level container (portable). Alternative names: Project, Space, Vault.
- **Chat**: A conversation tree.
- **Message**: A node in the tree with `parentId`, `role`, and `parts`.
- **Branch**: A path through the message tree. “Branch head” is the currently selected leaf.
- **Run**: One model invocation (useful for metadata, retries, streaming stats, tool traces).

## Message model notes (AI SDK alignment)

We store `message.parts` as our canonical content format (serialized JSON in SQLite). This keeps us aligned with AI SDK conventions and supports multimodal + tools.

Key implications:
- “Content” is not a single string; it’s an ordered list of parts (text, image, file, tool call/result, etc.).
- Branching is naturally represented with `parentId` pointers and multiple children.
- “Metadata” we care about (provider/model/tokens/latency) should be stored in first-class columns (queryable), but we can also store the raw AI SDK response metadata in a JSON column for future compatibility.

## Data + storage sketch

**SQLite** is a strong fit for a desktop, local-first app.

Two viable layouts:
1) **Single DB for everything** (simplest operationally)
   - Pros: easy global search, fewer moving parts
   - Cons: exporting a workspace means copying a subset
2) **One DB per workspace + one global config file**
- Global config: app settings, recent workspaces, extension enablement
- Workspace DB: chats, folders, messages, assets, per-workspace prefs
   - Pros: workspace portability (copy one file/folder), easier backups
   - Cons: cross-workspace search needs extra work

My lean: **#2** (workspace portability matters; we can add global search later).

Workspace DB implementation notes:
- Use Bun SQLite + Drizzle ORM.
- Use the SQL-like query builder (`select().from().where()...`), not the relational query API.
- Use `drizzle-kit` to generate migrations and apply them at runtime when opening a workspace.

**Assets (images/video/files)**
- Store binary blobs on disk (not in SQLite), referenced by `assetId` in DB.
- Keep a workspace folder structure like:
  - `workspace.sqlite`
  - `assets/<assetId>.<ext>`
  - `thumbnails/<assetId>.webp` (optional)

## Providers (initial)

**Ollama**
- Local HTTP, no API key.
- Model discovery: fetch models list and let user choose “visible” models.

**OpenRouter**
- API key via Keychain.
- Model discovery: fetch list; user selects visible models.
- Multiple profiles supported (e.g., “Work”, “Personal”).

Provider profile fields (decided):
- `id`, `kind` (`ollama`, `openrouter`, …), `displayName`
- `authKind` (`api_key` | `api_key_pair` | `service_account_json` | `none` | `iam_role`)
- `baseUrl` (optional, useful for self-hosting / OpenAI-compatible endpoints)
- `apiKeyId` (Keychain item ref for primary secret)
- `apiSecretId` (Keychain item ref for secondary secret; `api_key_pair` only, e.g. AWS)
- `config` JSON (org/project IDs, region, custom headers, etc.)
- Enabled models in separate `models` table (FK to provider)
- Providers are **per-workspace** (stored in workspace SQLite DB)
- On new workspace creation, user can optionally copy providers from an existing workspace

## API key storage (macOS)

Goal: store secrets in **macOS Keychain**.

Unknowns / spike needed:
- Best Keychain integration path in **Electrobun/Bun** (native module vs shelling out to `security`).
- How we want to represent secret references (`apiKeyRef`) and rotation UX.

Fallback (temporary):
- Encrypted secrets in DB using a per-device key stored in Keychain (or, if blocked, a local config file with loud warnings).

## Where image/video lives (UX)

Options:
1) **In-chat only** (parts render inline)
2) **Separate “Media” view** (gallery with filters)
3) **Both** (recommended): in-chat inline + global/workspace gallery

I lean “both” because:
- Chat context is where generation happens
- Gallery is where people browse and reuse results

## Structured outputs (advanced)

We should support:
- Per-chat “output mode”: plain text (default) or JSON schema-driven output
- Users provide a JSON Schema (or a Zod-like editor later)
- We store the schema on the chat and the parsed object on the run/message

This likely maps to AI SDK’s structured output / object generation APIs.

## Extensions (early design notes)

We want an extension ecosystem (VS Code-ish), but we can start with a safe MVP.

Suggested phases:
- **Phase A (MVP)**: “extensions as tools”
  - Extensions register AI tools (function calling) and non-AI commands (export, transforms).
  - No UI contribution yet (or very limited, like adding a settings panel link).
- **Phase B**: UI surfaces
  - Sidebar panels, settings sections, command palette entries, context menu actions.
- **Phase C**: sandbox + permissions
  - Explicit capability prompts (“can read workspace files”, “can call network”, etc.)

MVP extension package idea:
- `mynth.extension.json` manifest (name, version, entrypoint, capabilities)
- JS/TS entrypoint loaded in the main process that registers:
  - tools (AI SDK compatible)
  - commands (exporters, utilities)
  - optional settings schema

## Open questions (to decide soon)

1) “Workspace” naming: Workspace vs Project vs Space vs Vault?
2) DB layout: single DB vs per-workspace DB + global DB?
3) Do we want a “Chat = tree” where the UI always shows the full tree, or default to a “linear view” with branch switching?
4) Message IDs: UUIDv7 vs ULID vs nanoid? (UUIDv7 is nice for ordering.)
5) Extension model: do we want to allow arbitrary JS execution, or require a more constrained “tool/command” API first?
6) Keychain integration: preferred approach in Electrobun/Bun?
