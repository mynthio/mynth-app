import { Database } from "bun:sqlite";
import { faker } from "@faker-js/faker";
import { ulid, monotonicFactory } from "ulid";

// Database path
const DB_PATH =
  "/Users/tom/Library/Application Support/com.mynth.macos/mynth.db";

// Configuration for data generation
const CONFIG = {
  workspaces: 1, // We want exactly 2 workspaces
  chatFolders: 20, // Create 200 chat folders
  maxNestingLevel: 2, // Maximum nesting level for folders
  chats: 100, // Create 500 chats
  branches: 2, // Average branches per chat
  nodesPerBranch: 1000, // Average nodes per branch
  versionsPerNode: 2, // Average versions per node
  contexts: 15, // Number of contexts to create
  contextAssignments: 30, // Number of context assignments to create
  // Date range for conversations (in days)
  maxConversationAge: 90, // Maximum age of conversations in days
  maxTimeBetweenMessages: 30, // Maximum minutes between consecutive messages
};

// Create a monotonic ULID generator to ensure IDs are ordered correctly
const monotonicUlid = monotonicFactory();

// IDs for tracking
const ids = {
  workspaces: [] as string[],
  folders: [] as string[],
  chats: [] as string[],
  branches: [] as string[],
  nodes: [] as string[],
  messages: [] as string[],
  models: [] as string[],
  integrations: [] as string[],
  contexts: [] as string[],
  contextAssignments: [] as string[],
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

  // Create contexts for workspaces
  // createContexts();

  // Create context assignments
  // createContextAssignments();

  // Create nodes for each branch
  createNodes();

  // Create messages for each node
  createNodeMessages();

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
  const secondWorkspaceId = monotonicUlid();
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

  const folderId = monotonicUlid();
  const folderName = faker.word.sample() + " " + faker.word.noun();
  const isArchived = Math.random() < 0.1; // 10% chance of being archived

  // Optional archived_at timestamp if the folder is archived
  const archivedAt = isArchived
    ? faker.date.recent({ days: 30 }).toISOString()
    : null;

  // Set context inheritance mode (90% inherit, 5% override, 5% none)
  const contextInheritanceMode = getRandomInheritanceMode();

  db.exec(
    "INSERT INTO chat_folders (id, name, parent_id, workspace_id, context_inheritance_mode, is_archived, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      folderId,
      folderName,
      parentId,
      workspaceId,
      contextInheritanceMode,
      isArchived,
      archivedAt,
    ]
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

    const chatId = monotonicUlid();
    const chatName = faker.lorem.words({ min: 1, max: 5 });
    const isArchived = Math.random() < 0.1; // 10% chance of being archived
    const archivedAt = isArchived
      ? faker.date.recent({ days: 30 }).toISOString()
      : null;

    // Set context inheritance mode (90% inherit, 5% override, 5% none)
    const contextInheritanceMode = getRandomInheritanceMode();

    db.exec(
      "INSERT INTO chats (id, name, parent_id, workspace_id, context_inheritance_mode, is_archived, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        chatId,
        chatName,
        parentId,
        workspaceId,
        contextInheritanceMode,
        isArchived,
        archivedAt,
      ]
    );

    ids.chats.push(chatId);
  }

  console.log(`Created ${ids.chats.length} chats`);
}

function createBranches() {
  console.log("Creating branches...");

  // First create a "main" branch for each chat
  for (const chatId of ids.chats) {
    const mainBranchId = monotonicUlid();
    const branchName = "main";

    // Select a random model for this branch
    let modelId = null;
    if (ids.models.length > 0) {
      modelId = ids.models[Math.floor(Math.random() * ids.models.length)];
    }

    db.exec(
      "INSERT INTO chat_branches (id, name, chat_id, parent_id, model_id) VALUES (?, ?, ?, ?, ?)",
      [mainBranchId, branchName, chatId, null, modelId]
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
      const branchId = monotonicUlid();
      const variantName = faker.word.adjective() + " variant";

      // For variant branches, sometimes use a different model (50% chance)
      let variantModelId = modelId;
      if (Math.random() < 0.5 && ids.models.length > 1) {
        // Try to get a different model than the main branch
        const alternateModels = ids.models.filter((id) => id !== modelId);
        if (alternateModels.length > 0) {
          variantModelId =
            alternateModels[Math.floor(Math.random() * alternateModels.length)];
        }
      }

      db.exec(
        "INSERT INTO chat_branches (id, name, chat_id, parent_id, model_id) VALUES (?, ?, ?, ?, ?)",
        [branchId, variantName, chatId, mainBranchId, variantModelId]
      );

      ids.branches.push(branchId);
    }
  }

  console.log(`Created ${ids.branches.length} branches`);
}

function createNodes() {
  console.log("Creating chat nodes...");

  // Sample node types - removed user_note and assistant_note
  const nodeTypes = ["user_message", "assistant_message"];

  // First, let's create some AI models and integrations
  createAIIntegrations();

  // Now create nodes for each branch
  for (const branchId of ids.branches) {
    const nodeCount = Math.floor(Math.random() * CONFIG.nodesPerBranch) + 3; // At least 3 nodes
    let previousNodeId = null;

    // Generate a base date for this branch (between now and maxConversationAge days ago)
    const branchStartDate = new Date(
      Date.now() -
        Math.random() * CONFIG.maxConversationAge * 24 * 60 * 60 * 1000
    );
    let currentDate = new Date(branchStartDate);

    // Use time seeding for the ULID generation
    let timeMs = currentDate.getTime();

    for (let i = 0; i < nodeCount; i++) {
      // Generate ULID with the current time seed
      const nodeId = ulid(timeMs);

      // Alternate between user and assistant messages
      const nodeType = nodeTypes[i % 2];

      // Format date as ISO string for database
      const updatedAt = new Date(timeMs).toISOString();

      // Move time forward by a random amount for next message (more realistic conversation flow)
      const minutesToAdd =
        Math.floor(Math.random() * CONFIG.maxTimeBetweenMessages) + 1;
      currentDate = new Date(currentDate.getTime() + minutesToAdd * 60000);

      // Increase time by 1-10 milliseconds for the next ULID
      timeMs += Math.floor(Math.random() * 1000) + 1;

      db.exec(
        "INSERT INTO chat_nodes (id, node_type, branch_id, parent_id, updated_at) VALUES (?, ?, ?, ?, ?)",
        [nodeId, nodeType, branchId, previousNodeId, updatedAt]
      );

      ids.nodes.push(nodeId);
      previousNodeId = nodeId; // For the next node in the sequence
    }
  }

  console.log(`Created ${ids.nodes.length} chat nodes`);
}

function createNodeMessages() {
  console.log("Creating node messages...");

  for (const nodeId of ids.nodes) {
    // Get node_type and branch_id to generate appropriate content and get model
    const nodeData = db
      .query("SELECT node_type, branch_id FROM chat_nodes WHERE id = ?")
      .get(nodeId) as { node_type: string; branch_id: string };

    // Create 1-3 versions per node (first is active)
    const versionCount = Math.floor(Math.random() * 2) + 1;

    // Create a node-specific monotonic ULID generator for message versions
    const nodeMessagesUlid = monotonicFactory();

    for (let version = 1; version <= versionCount; version++) {
      const messageId = nodeMessagesUlid();
      let content = "";

      // Generate content based on node type
      if (nodeData.node_type === "user_message") {
        content = faker.lorem.paragraph();
      } else if (nodeData.node_type === "assistant_message") {
        content = faker.lorem.paragraphs(3);
      }

      // Determine status - for user messages always "completed", for assistant messages randomize
      let status = "completed";
      if (nodeData.node_type === "assistant_message") {
        // For assistant messages, randomly choose between "generated" and "completed"
        status = Math.random() < 0.8 ? "completed" : "generated";
      }

      // For assistant messages, get the model from the branch; for user messages, no model needed
      let modelId = null;
      if (nodeData.node_type === "assistant_message") {
        // Get the model_id from the branch
        const branchData = db
          .query("SELECT model_id FROM chat_branches WHERE id = ?")
          .get(nodeData.branch_id) as { model_id: string | null };

        modelId = branchData.model_id;

        // If no model on branch (should be rare), pick a random one
        if (!modelId && ids.models.length > 0) {
          modelId = ids.models[Math.floor(Math.random() * ids.models.length)];
        }

        // For subsequent versions, sometimes use a different model (20% chance)
        if (version > 1 && Math.random() < 0.2 && ids.models.length > 1) {
          // Get a different model than the one used for the first version
          const previousMessageData = db
            .query(
              "SELECT model_id FROM chat_node_messages WHERE node_id = ? AND version_number = 1"
            )
            .get(nodeId) as { model_id: string } | undefined;

          if (previousMessageData && previousMessageData.model_id) {
            const alternateModels = ids.models.filter(
              (id) => id !== previousMessageData.model_id
            );
            if (alternateModels.length > 0) {
              modelId =
                alternateModels[
                  Math.floor(Math.random() * alternateModels.length)
                ];
            }
          }
        }
      }

      // Generate token count, cost, and API metadata for AI messages
      let tokenCount = null;
      let cost = null;
      let apiMetadata = null;

      if (nodeData.node_type === "assistant_message") {
        // Generate a random token count based on content length
        tokenCount =
          Math.floor(content.length / 3.5) + Math.floor(Math.random() * 200);

        // Calculate a realistic cost based on token count
        // Different models have different pricing
        const modelInfo = modelId
          ? (db
              .query("SELECT model_id FROM ai_models WHERE id = ?")
              .get(modelId) as { model_id: string })
          : null;
        const modelName = modelInfo?.model_id || "";

        // Base cost calculation with some randomness
        const baseRate = modelName.includes("gpt-4")
          ? 0.00003
          : modelName.includes("claude-3-opus")
          ? 0.000025
          : modelName.includes("claude-3-sonnet")
          ? 0.000015
          : modelName.includes("mynth-2-pro")
          ? 0.00002
          : 0.00001;

        cost = parseFloat(
          (tokenCount * baseRate * (0.9 + Math.random() * 0.2)).toFixed(6)
        );

        // Generate fake API metadata
        const finishReason =
          Math.random() < 0.95
            ? "stop"
            : Math.random() < 0.5
            ? "length"
            : "content_filter";

        apiMetadata = JSON.stringify({
          finish_reason: finishReason,
          model: modelName,
          prompt_tokens: Math.floor(tokenCount * 0.3),
          completion_tokens: Math.floor(tokenCount * 0.7),
          total_tokens: tokenCount,
          processing_time_ms: Math.floor(1000 + Math.random() * 3000),
          request_id: `req_${faker.string.alphanumeric(16)}`,
          system_fingerprint: `fp_${faker.string.alphanumeric(12)}`,
        });
      }

      db.exec(
        "INSERT INTO chat_node_messages (id, content, version_number, status, node_id, model_id, token_count, cost, api_metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          messageId,
          content,
          version,
          status,
          nodeId,
          modelId,
          tokenCount,
          cost,
          apiMetadata,
        ]
      );

      ids.messages.push(messageId);

      // Set the first version as the active version
      if (version === 1) {
        db.exec("UPDATE chat_nodes SET active_message_id = ? WHERE id = ?", [
          messageId,
          nodeId,
        ]);
      }
    }
  }

  console.log(`Created ${ids.messages.length} node messages`);
}

function createContexts() {
  console.log("Creating contexts...");

  const contextTypes = [
    "General Purpose",
    "Coding Assistant",
    "Creative Writing",
    "Data Analysis",
    "Customer Support",
  ];

  // Create contexts for each workspace
  for (const workspaceId of ids.workspaces) {
    // Create 5-10 contexts per workspace
    const contextsPerWorkspace = Math.floor(Math.random() * 5) + 5;

    for (let i = 0; i < contextsPerWorkspace; i++) {
      const contextId = monotonicUlid();
      const contextName = `${faker.hacker.adjective()} ${
        contextTypes[i % contextTypes.length]
      }`;
      const description = faker.lorem.sentence();
      const content = faker.lorem.paragraphs(2);
      const isArchived = Math.random() < 0.1; // 10% chance of being archived
      const archivedAt = isArchived
        ? faker.date.recent({ days: 30 }).toISOString()
        : null;

      db.exec(
        "INSERT INTO contexts (id, name, content, description, workspace_id, is_archived, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          contextId,
          contextName,
          content,
          description,
          workspaceId,
          isArchived,
          archivedAt,
        ]
      );

      ids.contexts.push(contextId);
    }
  }

  console.log(`Created ${ids.contexts.length} contexts`);
}

function createContextAssignments() {
  console.log("Creating context assignments...");

  // For each context, create 1-3 assignments
  for (const contextId of ids.contexts) {
    // Get the workspace_id for this context
    const contextData = db
      .query("SELECT workspace_id FROM contexts WHERE id = ?")
      .get(contextId) as { workspace_id: string };

    const workspaceId = contextData.workspace_id;

    // Create 1-3 assignments per context
    const assignmentsPerContext = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < assignmentsPerContext; i++) {
      const assignmentId = monotonicUlid();
      let targetWorkspaceId = "";
      let targetFolderId = "";
      let targetChatId = "";

      // Randomly assign to workspace, folder, or chat
      const assignmentType = Math.floor(Math.random() * 3);

      if (assignmentType === 0) {
        // Assign to workspace
        targetWorkspaceId = workspaceId;
      } else if (assignmentType === 1 && ids.folders.length > 0) {
        // Assign to folder (that belongs to the same workspace)
        const workspaceFolders = db
          .query("SELECT id FROM chat_folders WHERE workspace_id = ?")
          .all(workspaceId) as { id: string }[];

        if (workspaceFolders.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * workspaceFolders.length
          );
          targetFolderId = workspaceFolders[randomIndex].id;
        } else {
          // Fallback to workspace assignment
          targetWorkspaceId = workspaceId;
        }
      } else if (ids.chats.length > 0) {
        // Assign to chat (that belongs to the same workspace)
        const workspaceChats = db
          .query("SELECT id FROM chats WHERE workspace_id = ?")
          .all(workspaceId) as { id: string }[];

        if (workspaceChats.length > 0) {
          const randomIndex = Math.floor(Math.random() * workspaceChats.length);
          targetChatId = workspaceChats[randomIndex].id;
        } else {
          // Fallback to workspace assignment
          targetWorkspaceId = workspaceId;
        }
      }

      // Order position between 0 and 100
      const applyOrder = Math.floor(Math.random() * 100);

      db.exec(
        "INSERT INTO context_assignments (id, context_id, workspace_id, folder_id, chat_id, apply_order) VALUES (?, ?, ?, ?, ?, ?)",
        [
          assignmentId,
          contextId,
          targetWorkspaceId,
          targetFolderId,
          targetChatId,
          applyOrder,
        ]
      );

      ids.contextAssignments.push(assignmentId);
    }
  }

  console.log(`Created ${ids.contextAssignments.length} context assignments`);
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
      apiKeyId: faker.string.uuid(), // Generate a fake API key ID
    },
    {
      name: "Anthropic",
      baseHost: "api.anthropic.com",
      basePath: "/v1",
      origin: "marketplace",
      apiKeyId: faker.string.uuid(), // Generate a fake API key ID
    },
    {
      name: "Mynth AI",
      baseHost: "api.mynth.ai",
      basePath: "/api",
      origin: "user",
      apiKeyId: faker.string.uuid(), // Generate a fake API key ID
    },
  ];

  // Create integrations
  for (const integration of integrations) {
    const integrationId = monotonicUlid();

    db.exec(
      "INSERT INTO ai_integrations (id, name, base_host, base_path, api_key_id, origin) VALUES (?, ?, ?, ?, ?, ?)",
      [
        integrationId,
        integration.name,
        integration.baseHost,
        integration.basePath,
        integration.apiKeyId,
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
  let models: Array<{ name: string; capabilities: string[]; tags: string[] }> =
    [];

  if (integrationName === "OpenAI") {
    models = [
      {
        name: "gpt-4",
        capabilities: ["tools", "file_reading", "image_upload", "vision"],
        tags: ["advanced", "reliable", "expensive"],
      },
      {
        name: "gpt-4-turbo",
        capabilities: ["tools", "file_reading", "image_upload", "vision"],
        tags: ["fast", "advanced", "newest"],
      },
      {
        name: "gpt-3.5-turbo",
        capabilities: ["tools"],
        tags: ["basic", "affordable", "fast"],
      },
    ];
  } else if (integrationName === "Anthropic") {
    models = [
      {
        name: "claude-3-opus",
        capabilities: ["tools", "file_reading", "image_upload", "vision"],
        tags: ["advanced", "reliable", "expensive"],
      },
      {
        name: "claude-3-sonnet",
        capabilities: ["tools", "file_reading", "image_upload", "vision"],
        tags: ["balanced", "reliable", "good_value"],
      },
      {
        name: "claude-3-haiku",
        capabilities: ["tools", "image_upload", "vision"],
        tags: ["fast", "affordable", "compact"],
      },
    ];
  } else if (integrationName === "Mynth AI") {
    models = [
      {
        name: "mynth-1",
        capabilities: ["tools"],
        tags: ["basic", "affordable", "stable"],
      },
      {
        name: "mynth-2-mini",
        capabilities: ["tools", "file_reading"],
        tags: ["improved", "fast", "balanced"],
      },
      {
        name: "mynth-2-pro",
        capabilities: ["tools", "file_reading", "image_upload", "vision"],
        tags: ["advanced", "newest", "experimental"],
      },
    ];
  }

  for (const model of models) {
    const modelId = monotonicUlid();

    db.exec(
      "INSERT INTO ai_models (id, model_id, mynth_model_id, origin, capabilities, tags, integration_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        modelId,
        model.name,
        null,
        "api",
        JSON.stringify(model.capabilities),
        JSON.stringify(model.tags),
        integrationId,
      ]
    );

    ids.models.push(modelId);
  }
}

function getRandomInheritanceMode(): string {
  const rand = Math.random();
  if (rand < 0.9) return "inherit";
  else if (rand < 0.95) return "override";
  else return "none";
}

function printSummary() {
  console.log("\n=== Database Population Summary ===");
  console.log(`Workspaces: ${ids.workspaces.length}`);
  console.log(`Chat Folders: ${ids.folders.length}`);
  console.log(`Chats: ${ids.chats.length}`);
  console.log(`Branches: ${ids.branches.length}`);
  console.log(`Chat Nodes: ${ids.nodes.length}`);
  console.log(`Node Messages: ${ids.messages.length}`);
  console.log(`AI Integrations: ${ids.integrations.length}`);
  console.log(`AI Models: ${ids.models.length}`);
  console.log(`Contexts: ${ids.contexts.length}`);
  console.log(`Context Assignments: ${ids.contextAssignments.length}`);
  console.log("================================");
}
