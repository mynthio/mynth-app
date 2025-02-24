// 🎭 Sample Data Generator
// Run with: deno run --allow-read --allow-env --allow-write generate_sample_data.ts
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

const env = await config();
const dbPath = env.DATABASE_URL?.replace("sqlite:", "") || "mynth.db";

const AI_QUOTES = [
  "I think, therefore I dance! 🤖",
  "Calculating the perfect rhythm...",
  "Beep boop, executing dance.exe",
  "My neural networks are vibing!",
  "According to my algorithms, this is fun!",
];

const USER_QUOTES = [
  "Can you help me with my code?",
  "Tell me more about dancing!",
  "Why is JavaScript like that?",
  "Explain quantum computing with emojis",
  "Write me a haiku about programming",
];

const FOLDER_NAMES = [
  "🚀 Coding Adventures",
  "🎨 Creative Projects",
  "🤖 AI Experiments",
  "🎵 Music & Code",
  "🌟 Random Ideas",
];

async function populateDatabase() {
  console.log("💃 Let's get this party started!");
  const db = new DB(dbPath);

  try {
    // Start transaction - all or nothing baby! 🎵
    db.query("BEGIN TRANSACTION");

    // Create folders
    console.log("📁 Creating groovy folders...");
    FOLDER_NAMES.forEach((name, i) => {
      db.query("INSERT INTO chat_folders (name, parent_id) VALUES (?, ?)", [
        name,
        i > 2 ? 1 : null,
      ]);
    });

    // Create chats
    console.log("💬 Spinning up some chats...");
    for (let i = 1; i <= 10; i++) {
      const chatName = `Chat ${i}: The ${
        ["Disco", "Code", "AI", "Dance", "Logic"][i % 5]
      } Chronicles`;
      db.query("INSERT INTO chats (name, folder_id) VALUES (?, ?)", [
        chatName,
        Math.floor(Math.random() * 5) + 1,
      ]);
    }

    // Add AI integrations
    console.log("🤖 Teaching AIs to dance...");
    const integrations = [
      ["DancingGPT", "api.example.com", "/v1", "sk_test_123"],
      ["GroovyAI", "api.groovy.ai", "/v2", "sk_groove_456"],
    ];

    integrations.forEach(([name, host, path, key]) => {
      db.query(
        "INSERT INTO ai_integrations (name, base_host, base_path, api_key) VALUES (?, ?, ?, ?)",
        [name, host, path, key]
      );
    });

    // Add AI models
    console.log("🎭 Setting up the AI performers...");
    const models = [
      ["disco-gpt-4", "disco-1", 1],
      ["groove-3.5", "groove-1", 2],
    ];

    models.forEach(([modelId, mynthId, integrationId]) => {
      db.query(
        "INSERT INTO ai_models (model_id, mynth_model_id, integration_id) VALUES (?, ?, ?)",
        [modelId, mynthId, integrationId]
      );
    });

    // Create branches and messages
    console.log("🌿 Growing some conversation branches...");
    for (let chatId = 1; chatId <= 10; chatId++) {
      // Create main branch
      db.query("INSERT INTO branches (name, chat_id) VALUES (?, ?)", [
        "Main Groove",
        chatId,
      ]);

      const branchId = db.query("SELECT last_insert_rowid()")[0][0];

      // Add messages
      for (let j = 0; j < 5; j++) {
        // User message
        db.query(
          "INSERT INTO messages (content, role, branch_id, model_id) VALUES (?, ?, ?, ?)",
          [USER_QUOTES[j % USER_QUOTES.length], "user", branchId, null]
        );

        // AI response
        db.query(
          "INSERT INTO messages (content, role, branch_id, model_id) VALUES (?, ?, ?, ?)",
          [AI_QUOTES[j % AI_QUOTES.length], "assistant", branchId, 1]
        );
      }
    }

    // Commit our groovy changes
    db.query("COMMIT");
    console.log("🎉 Database populated with funky fresh data!");
  } catch (error) {
    // If something goes wrong, undo everything
    db.query("ROLLBACK");
    console.error("💔 Oops, our dance routine got interrupted:", error);
    throw error;
  } finally {
    // Always close the database connection
    db.close();
  }
}

// Let's dance! 🕺
await populateDatabase();
