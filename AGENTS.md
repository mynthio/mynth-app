Project is an AI chat desktop app using Electron Forge.

# Rules

- This is pre-alpha stage, which means we do not do any backward comatiblity etc. we just make changes, even breaking ones, not worrying about anything
- Use pnpm as package manager
- Never run/edit drizzle migrations. User is handling migrations manually.
- Never run dev server
- When running `pnpm install ...` run outside sandbox (not sandboxed).
- Always run lint and format at the end of each task using `pnpm lint` and `pnpm fmt`
- Always use Coss UI components and patterns from https://coss.com/ui/llms.txt.
- Always use Coss UI styling; do not add custom styles unless the user explicitly asks for custom styles.
- Use Hugeicons for icons only. If MCP is available use it to find icons.

# Documentation

- Due to early stage, we do not write explanation or `why` behind the changes, we just overwrite notes and plan with new decisions. No fallback and no backward compatibility.

# Notes

- Ignore all TSC errors from node_modules and do not try to fix TS config
