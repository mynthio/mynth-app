import { Database } from "bun:sqlite";
import { faker } from "@faker-js/faker";

// Database path
const DB_PATH =
  "/Users/tom/Library/Application Support/com.mynth.macos/mynth.db";

// Configuration for data generation
const CONFIG = {
  workspaces: 2, // We want exactly 2 workspaces
  chatFolders: 300, // Create 200 chat folders
  maxNestingLevel: 5, // Maximum nesting level for folders
  chats: 1500, // Create 500 chats
  branches: 10, // Average branches per chat
  nodesPerBranch: 100, // Average nodes per branch
  versionsPerNode: 2, // Average versions per node
};

// IDs for tracking
const ids = {
  workspaces: [] as string[],
  folders: [] as string[],
  chats: [] as string[],
  branches: [] as string[],
  nodes: [] as string[],
  versions: [] as string[],
  models: [] as string[],
  integrations: [] as string[],
};

// Connect to the database
console.log(`Connecting to SQLite database at: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Start a transaction
db.exec("BEGIN TRANSACTION");

try {
  // Create workspaces - including one with id "w-default"
  createWorkspaces();

  // Create chat folders with random nesting
  createChatFolders();

  // Create chats linked to folders
  createChats();

  // Create branches for each chat
  createBranches();

  // Create nodes for each branch
  createNodes();

  // Create content versions for each node
  createContentVersions();

  // Commit all changes
  db.exec("COMMIT");
  console.log("Database successfully populated with test data!");

  // Print summary
  printSummary();
} catch (error) {
  // Rollback on error
  db.exec("ROLLBACK");
  console.error("Error populating database:", error);
}

// Functions to create each type of data
function createWorkspaces() {
  console.log("Creating workspaces...");

  // Create one additional workspace
  const secondWorkspaceId = `workspace-${faker.string.uuid()}`;
  const secondWorkspaceName = faker.company.name() + " Workspace";

  db.exec("INSERT INTO workspaces (id, name) VALUES (?, ?)", [
    secondWorkspaceId,
    secondWorkspaceName,
  ]);

  ids.workspaces.push(secondWorkspaceId);

  console.log(`Created ${ids.workspaces.length} workspaces`);
}

function createChatFolders() {
  console.log("Creating chat folders...");

  // Map to keep track of folders at each level
  const foldersByLevel = new Map<number, string[]>();
  foldersByLevel.set(0, []); // Root level folders

  // Create root level folders
  const rootFolderCount = Math.floor(CONFIG.chatFolders / 3); // About 1/3 at root level

  for (let i = 0; i < rootFolderCount; i++) {
    const folderId = createChatFolder(null);
    foldersByLevel.get(0)!.push(folderId);
  }

  // Create nested folders
  let remainingFolders = CONFIG.chatFolders - rootFolderCount;

  for (
    let level = 1;
    level < CONFIG.maxNestingLevel && remainingFolders > 0;
    level++
  ) {
    foldersByLevel.set(level, []);

    // Get parent folders from previous level
    const parentFolders = foldersByLevel.get(level - 1)!;
    if (parentFolders.length === 0) break;

    // Distribute remaining folders across parents
    const foldersPerParent = Math.max(
      1,
      Math.floor(remainingFolders / parentFolders.length)
    );

    for (const parentId of parentFolders) {
      const folderCount = Math.min(
        remainingFolders,
        Math.floor(foldersPerParent * (0.5 + Math.random()))
      );

      for (let i = 0; i < folderCount && remainingFolders > 0; i++) {
        const folderId = createChatFolder(parentId);
        foldersByLevel.get(level)!.push(folderId);
        remainingFolders--;
      }

      if (remainingFolders <= 0) break;
    }
  }

  // If we still have folders to create, add them to random existing parents
  while (remainingFolders > 0) {
    const allFolderIds = ids.folders.slice();
    const parentId =
      allFolderIds[Math.floor(Math.random() * allFolderIds.length)];

    createChatFolder(parentId);
    remainingFolders--;
  }

  console.log(`Created ${ids.folders.length} chat folders`);
}

function createChatFolder(parentId: string | null): string {
  // Choose workspace - 80% chance of using default workspace
  const workspaceId =
    Math.random() < 0.8
      ? ids.workspaces[0] // Default workspace
      : ids.workspaces[Math.floor(Math.random() * ids.workspaces.length)];

  const folderId = `folder-${faker.string.uuid()}`;
  const folderName = faker.word.sample() + " " + faker.word.noun();
  const isArchived = Math.random() < 0.1; // 10% chance of being archived

  // Optional archived_at timestamp if the folder is archived
  const archivedAt = isArchived
    ? faker.date.recent({ days: 30 }).toISOString()
    : null;

  db.exec(
    "INSERT INTO chat_folders (id, name, parent_id, workspace_id, is_archived, archived_at) VALUES (?, ?, ?, ?, ?, ?)",
    [folderId, folderName, parentId, workspaceId, isArchived, archivedAt]
  );

  ids.folders.push(folderId);
  return folderId;
}

function createChats() {
  console.log("Creating chats...");

  for (let i = 0; i < CONFIG.chats; i++) {
    // Decide if the chat belongs to a folder or directly to a workspace
    const hasParentFolder = Math.random() < 0.7; // 70% chance to have a parent folder

    let parentId = null;
    let workspaceId = null;

    if (hasParentFolder && ids.folders.length > 0) {
      parentId = ids.folders[Math.floor(Math.random() * ids.folders.length)];

      // Get the workspace ID for this folder
      const folderWorkspace = db
        .query("SELECT workspace_id FROM chat_folders WHERE id = ?")
        .get(parentId) as { workspace_id: string };
      workspaceId = folderWorkspace.workspace_id;
    } else {
      // No parent folder, assign directly to a workspace
      workspaceId =
        Math.random() < 0.8
          ? ids.workspaces[0] // Default workspace
          : ids.workspaces[Math.floor(Math.random() * ids.workspaces.length)];
    }

    const chatId = `chat-${faker.string.uuid()}`;
    const chatName = faker.lorem.words({ min: 1, max: 5 });
    const isArchived = Math.random() < 0.1; // 10% chance of being archived
    const archivedAt = isArchived
      ? faker.date.recent({ days: 30 }).toISOString()
      : null;

    db.exec(
      "INSERT INTO chats (id, name, parent_id, workspace_id, is_archived, archived_at) VALUES (?, ?, ?, ?, ?, ?)",
      [chatId, chatName, parentId, workspaceId, isArchived, archivedAt]
    );

    ids.chats.push(chatId);
  }

  console.log(`Created ${ids.chats.length} chats`);
}

function createBranches() {
  console.log("Creating branches...");

  // First create a "main" branch for each chat
  for (const chatId of ids.chats) {
    const mainBranchId = `branch-${faker.string.uuid()}`;
    const branchName = "main";

    db.exec(
      "INSERT INTO chat_branches (id, name, chat_id, parent_id) VALUES (?, ?, ?, ?)",
      [mainBranchId, branchName, chatId, null]
    );

    ids.branches.push(mainBranchId);

    // Set this as the current branch for the chat
    db.exec("UPDATE chats SET current_branch_id = ? WHERE id = ?", [
      mainBranchId,
      chatId,
    ]);

    // Sometimes create additional branches (variations)
    const additionalBranchCount = Math.floor(Math.random() * CONFIG.branches);

    for (let i = 0; i < additionalBranchCount; i++) {
      const branchId = `branch-${faker.string.uuid()}`;
      const variantName = faker.word.adjective() + " variant";

      db.exec(
        "INSERT INTO chat_branches (id, name, chat_id, parent_id) VALUES (?, ?, ?, ?)",
        [branchId, variantName, chatId, mainBranchId]
      );

      ids.branches.push(branchId);
    }
  }

  console.log(`Created ${ids.branches.length} branches`);
}

function createNodes() {
  console.log("Creating chat nodes...");

  // Sample node types
  const nodeTypes = [
    "user_message",
    "assistant_message",
    "user_note",
    "assistant_note",
  ];

  // First, let's create some AI models and integrations
  createAIIntegrations();

  // Now create nodes for each branch
  for (const branchId of ids.branches) {
    const nodeCount = Math.floor(Math.random() * CONFIG.nodesPerBranch) + 3; // At least 3 nodes
    let previousNodeId = null;

    for (let i = 0; i < nodeCount; i++) {
      const nodeId = `node-${faker.string.uuid()}`;
      const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];

      // Only assign model_id for assistant messages
      const modelId = nodeType.includes("assistant")
        ? ids.models[Math.floor(Math.random() * ids.models.length)]
        : null;

      db.exec(
        "INSERT INTO chat_nodes (id, node_type, branch_id, parent_id, model_id) VALUES (?, ?, ?, ?, ?)",
        [nodeId, nodeType, branchId, previousNodeId, modelId]
      );

      ids.nodes.push(nodeId);
      previousNodeId = nodeId; // For the next node in the sequence
    }
  }

  console.log(`Created ${ids.nodes.length} chat nodes`);
}

function createContentVersions() {
  console.log("Creating content versions...");

  for (const nodeId of ids.nodes) {
    // Get node_type to generate appropriate content
    const nodeData = db
      .query("SELECT node_type FROM chat_nodes WHERE id = ?")
      .get(nodeId) as { node_type: string };

    // Create 1-3 versions per node (first is active)
    const versionCount = Math.floor(Math.random() * 2) + 1;

    for (let version = 1; version <= versionCount; version++) {
      const versionId = `cv-${faker.string.uuid()}`;
      let content = "";

      // Generate content based on node type
      if (nodeData.node_type === "user_message") {
        content = faker.lorem.paragraph();
      } else if (nodeData.node_type === "assistant_message") {
        content = faker.lorem.paragraphs(3);
      } else if (
        nodeData.node_type === "user_note" ||
        nodeData.node_type === "assistant_note"
      ) {
        content = faker.lorem.sentence();
      }

      db.exec(
        "INSERT INTO chat_node_content_versions (id, content, version_number, node_id) VALUES (?, ?, ?, ?)",
        [versionId, content, version, nodeId]
      );

      ids.versions.push(versionId);

      // Set the first version as the active version
      if (version === 1) {
        db.exec("UPDATE chat_nodes SET active_version_id = ? WHERE id = ?", [
          versionId,
          nodeId,
        ]);
      }
    }
  }

  console.log(`Created ${ids.versions.length} content versions`);
}

function createAIIntegrations() {
  console.log("Creating AI integrations and models...");

  // Define some AI integrations
  const integrations = [
    {
      name: "OpenAI",
      baseHost: "api.openai.com",
      basePath: "/v1",
      origin: "user",
    },
    {
      name: "Anthropic",
      baseHost: "api.anthropic.com",
      basePath: "/v1",
      origin: "marketplace",
    },
    {
      name: "Mynth AI",
      baseHost: "api.mynth.ai",
      basePath: "/api",
      origin: "user",
    },
  ];

  // Create integrations
  for (const integration of integrations) {
    const integrationId = `ai-${faker.string.uuid()}`;

    db.exec(
      "INSERT INTO ai_integrations (id, name, base_host, base_path, origin) VALUES (?, ?, ?, ?, ?)",
      [
        integrationId,
        integration.name,
        integration.baseHost,
        integration.basePath,
        integration.origin,
      ]
    );

    ids.integrations.push(integrationId);

    // Create models for each integration
    createModelsForIntegration(integrationId, integration.name);
  }
}

function createModelsForIntegration(
  integrationId: string,
  integrationName: string
) {
  let models: string[] = [];

  if (integrationName === "OpenAI") {
    models = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"];
  } else if (integrationName === "Anthropic") {
    models = ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"];
  } else if (integrationName === "Mynth AI") {
    models = ["mynth-1", "mynth-2-mini", "mynth-2-pro"];
  }

  for (const modelName of models) {
    const modelId = `model-${faker.string.uuid()}`;

    db.exec(
      "INSERT INTO ai_models (id, model_id, mynth_model_id, origin, integration_id) VALUES (?, ?, ?, ?, ?)",
      [modelId, modelName, null, "api", integrationId]
    );

    ids.models.push(modelId);
  }
}

function printSummary() {
  console.log("\n=== Database Population Summary ===");
  console.log(`Workspaces: ${ids.workspaces.length}`);
  console.log(`Chat Folders: ${ids.folders.length}`);
  console.log(`Chats: ${ids.chats.length}`);
  console.log(`Branches: ${ids.branches.length}`);
  console.log(`Chat Nodes: ${ids.nodes.length}`);
  console.log(`Content Versions: ${ids.versions.length}`);
  console.log(`AI Integrations: ${ids.integrations.length}`);
  console.log(`AI Models: ${ids.models.length}`);
  console.log("================================");
}
