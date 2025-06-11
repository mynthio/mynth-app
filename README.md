# Mynth

<div align="center">
<img src="https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=%23FFFFFF" alt="Tauri">
<img src="https://img.shields.io/badge/SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=c8c9cb" alt="SolidJS">
<img src="https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
<img src="https://img.shields.io/badge/unocss-333333.svg?style=for-the-badge&logo=unocss&logoColor=white" alt="UnoCSS">
</div>

## Getting Started

Mynth is using pnpm as package manager and moon as a task runner. You can use moon either via dev dependency installed by pnpm, or directly via shell. The choice is your, but we recommend sticking to pnpm and use commands via pnpm.

### Running app in development mode

#### Using pnpm

Clone the repository, make sure you have `pnpm` installed and run:

```bash
# Install dependencies
pnpm install
# Run commands
pnpm dev
```

#### Using moon directly

Install moon:

```bash
brew install moon
```

Run the development server:

```bash
moon dev
```

**_Note that there's no need to run `install` command, as moon will automatically install dependencies._**

### Useful paths

App directory: `/Users/<USERNAME>/Library/Application Support/com.mynth.macos`

### 📝 License

This project is licensed under the **MIT License** for open-source use. However, if you plan to **sell, bundle, or commercially distribute** this software, you must obtain a commercial license. See [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md) for details.

### Populate DB

```sql
INSERT INTO "providers" ("id", "name", "base_url", "auth_type", "api_key_id", "json_auth_config", "json_keys", "json_variables", "models_sync_strategy", "marketplace_id", "updated_at") VALUES
('1', 'Ollama', 'http://localhost:11434', 'none', NULL, '{}', '{}', '{}', 'local', NULL, '2025-06-09 13:57:03');

INSERT INTO "models" ("id", "name", "display_name", "provider_id", "max_input_tokens", "input_price", "output_price", "tags", "capabilities", "source", "is_hidden", "is_pinned", "is_favourite", "request_template", "json_config", "marketplace_id", "json_variables", "json_metadata_v1", "updated_at") VALUES
('1', 'gemma3:1b', 'Gemma 3 1B', '1', NULL, NULL, NULL, NULL, NULL, 'local', '0', '0', '0', NULL, NULL, NULL, NULL, NULL, '2025-06-09 13:59:38');

INSERT INTO "provider_endpoints" ("id", "provider_id", "display_name", "type", "path", "method", "compatibility", "request_template", "json_request_schema", "json_response_schema", "json_request_config", "json_response_config", "json_variables", "streaming", "priority", "json_config", "marketplace_id") VALUES
('1', '1', 'Chat stream', 'chat_stream', '/v1/chat/completions', 'POST', 'open_ai', NULL, NULL, NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL);

INSERT INTO "model_endpoint_configurations" ("id", "model_id", "endpoint_id", "endpoint_type", "updated_at") VALUES
('1', '1', '1', 'chat_stream', '2025-06-09 13:59:53');
```
