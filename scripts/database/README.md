# Database Scripts

This directory contains scripts for managing and manipulating the Mynth database.

## Scripts

- `index.ts`: Simple hello world script
- `populate-database.ts`: Script to populate the Mynth SQLite database with test data

## Database Population Script

The `populate-database.ts` script populates the SQLite database with sample data for testing and development purposes.

### What it creates:

- 2 workspaces (including one with the ID "w-default")
- ~200 chat folders with random nesting (up to 5 levels deep)
- ~500 chats linked to folders or directly to workspaces
- Multiple branches for each chat
- Chat nodes (messages and notes) for each branch
- Content versions for each node
- Sample AI integrations and models

### Running the script

To run the script, make sure you have Bun installed, then:

```bash
cd scripts/database
pnpm install
bun run populate-database.ts
```

### Configuration

You can modify the `CONFIG` object at the top of the script to adjust the amount of data generated:

```typescript
const CONFIG = {
  workspaces: 2, // We want exactly 2 workspaces
  chatFolders: 200, // Create 200 chat folders
  maxNestingLevel: 5, // Maximum nesting level for folders
  chats: 500, // Create 500 chats
  branches: 3, // Average branches per chat
  nodesPerBranch: 10, // Average nodes per branch
  versionsPerNode: 2, // Average versions per node
};
```

### IMPORTANT NOTE

This script will add data to the existing database without removing existing records. If you want a clean database, you should delete the database file before running this script (or back it up first).
