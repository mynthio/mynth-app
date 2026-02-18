# Mynth Desktop

Local-first AI chat desktop app (Electrobun + Bun + React). Early stage.

## Product docs

- `docs/SKETCHPAD.md` — ideas, open questions, design notes
- `docs/PLAN.md` — concrete implementation plan and milestones
- `docs/TASKS.md` — repo-local tickets (step-by-step)

---

## Template notes

This repo started from a React + Tailwind + Vite Electrobun template.

A fast Electrobun desktop app template with React, Tailwind CSS, and Vite for hot module replacement (HMR).

## Getting Started

```bash
# Install dependencies
bun install

# Development without HMR (uses bundled assets)
bun run dev

# Development with HMR (recommended)
bun run dev:hmr

# Build for production
bun run build

# Build for production release
bun run build:prod
```

## Linting and Formatting (OXC)

This project uses [OXC](https://oxc.rs/) for fast linting and formatting.

```bash
# Format all supported files in place
bun run format

# Check formatting without writing changes
bun run format:check

# Lint with default OXC correctness rules plus React and import plugins
bun run lint

# Lint and apply safe auto-fixes
bun run lint:fix
```

## How HMR Works

When you run `bun run dev:hmr`:

1. **Vite dev server** starts on `http://localhost:5173` with HMR enabled
2. **Electrobun** starts and detects the running Vite server
3. The app loads from the Vite dev server instead of bundled assets
4. Changes to React components update instantly without full page reload

When you run `bun run dev` (without HMR):

1. Electrobun starts and loads from `views://mainview/index.html`
2. You need to rebuild (`bun run build`) to see changes

## Project Structure

```
├── src/
│   ├── bun/
│   │   ├── index.ts        # Main process (Electrobun/Bun)
│   │   └── db/             # Drizzle + Bun SQLite workspace DB layer
│   │       ├── schema.ts
│   │       ├── migrations/
│   │       └── cli/
│   └── mainview/
│       ├── App.tsx         # React app component
│       ├── main.tsx        # React entry point
│       ├── index.html      # HTML template
│       └── index.css       # Tailwind CSS
├── electrobun.config.ts    # Electrobun configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

## Workspace Storage Layout

Each workspace DB is discovered by folder under:

`<userData>/workspaces/<workspaceId>/`

Expected structure:

```
<workspaceId>/
├── workspace.sqlite
└── assets/
```

## Customizing

- **React components**: Edit files in `src/mainview/`
- **Tailwind theme**: Edit `tailwind.config.js`
- **Vite settings**: Edit `vite.config.ts`
- **Window settings**: Edit `src/bun/index.ts`
- **App metadata**: Edit `electrobun.config.ts`
