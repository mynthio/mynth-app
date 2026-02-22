# IPC Guide

Consistent IPC structure for this repo. Keep it small and direct. Follow YAGNI.

## Files

- `src/shared/ipc.ts`
  - IPC channel constants.
  - Renderer-facing API types.
- `src/shared/workspace-name.ts` and `src/shared/workspace-id.ts`
  - Shared runtime parsers for IPC payloads.
- `src/preload.ts`
  - `contextBridge` API surface only.
  - No direct `ipcRenderer` exposure.
- `src/main-process/ipc/register-handler.ts`
  - Single helper to register invoke handlers with sender trust checks.
- `src/main-process/ipc/trusted-sender.ts`
  - Trusted renderer URL checks.
- `src/main-process/ipc/*.ts`
  - Domain handlers (example: `workspace-handlers.ts`).
- `src/main-process/ipc/index.ts`
  - Single entrypoint for IPC registration.

## Rules

1. Add channels in `src/shared/ipc.ts`. Do not hardcode channel strings in preload or main-process handlers.
2. Treat IPC args as `unknown` in main-process handlers and validate before use.
3. Reuse shared parsers from `src/shared/*` for both renderer and main-process consistency.
4. Register handlers only through `registerIpcHandler(...)`.
5. Keep handler files domain-scoped (`workspace-handlers.ts`, `chat-handlers.ts`, etc.).
6. Keep handlers thin; call existing domain modules for filesystem/DB work.
7. Do not add generic IPC abstractions unless there is a concrete repeated need.

## Add New IPC Endpoint

1. Add channel constant and API type in `src/shared/ipc.ts`.
2. Add or update payload parser(s) in `src/shared/*`.
3. Expose one method in `src/preload.ts`.
4. Register handler in the proper file under `src/main-process/ipc/` via `registerIpcHandler`.
5. Add the handler registration to `src/main-process/ipc/index.ts` if it is a new handler module.
6. Use the new `window.electronAPI` method from renderer code.
7. Run `pnpm fmt` and `pnpm lint`.

## Security Baseline

- Keep `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Keep renderer navigation restricted to trusted URLs.
- Keep `window.open` blocked unless there is an explicit approved use case.
- Validate IPC payloads in main process before filesystem/DB calls.
