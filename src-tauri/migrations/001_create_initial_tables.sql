-- 🏢 Workspaces
-- The top-level organization unit where all the magic happens
CREATE TABLE
    workspaces (
        id TEXT PRIMARY KEY NOT NULL, -- workspace-[uuid]
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🌳 Folder Structure
-- These tables handle the organization of chats into a tree-like structure
-- Because nobody likes a messy room, right? 
CREATE TABLE
    chat_folders (
        id TEXT PRIMARY KEY NOT NULL, -- folder-[uuid]
        name TEXT NOT NULL,
        parent_id TEXT,
        workspace_id TEXT NOT NULL,
        is_archived BOOLEAN DEFAULT FALSE, -- Taking a disco break! 🏖️
        archived_at TIMESTAMP, -- When did we put this folder in the archive?
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES chat_folders (id) ON DELETE CASCADE,
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- 💬 Chat Management
-- The heart of our application! Where all the magic conversations happen
-- Think of it as a cozy living room where AIs and humans hang out
CREATE TABLE
    chats (
        id TEXT PRIMARY KEY NOT NULL, -- chat-[uuid]
        name TEXT NOT NULL,
        parent_id TEXT,
        workspace_id TEXT,
        current_branch_id TEXT,
        is_archived BOOLEAN DEFAULT FALSE, -- Time to rest those dancing feet! 🌙
        archived_at TIMESTAMP, -- When did this chat take a break?
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES chat_folders (id) ON DELETE CASCADE,
        FOREIGN KEY (current_branch_id) REFERENCES branches (id) ON DELETE SET NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- 🌿 Branching Logic
-- Because sometimes conversations need parallel universes
-- Like that time you wished you'd said something different...
-- Now with family trees - because every branch learns its dance moves from somewhere!
CREATE TABLE
    branches (
        id TEXT PRIMARY KEY NOT NULL, -- branch-[uuid]
        name TEXT,
        chat_id TEXT NOT NULL,
        parent_id TEXT,
        branched_from_message_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES branches (id) ON DELETE SET NULL,
        FOREIGN KEY (branched_from_message_id) REFERENCES messages (id) ON DELETE SET NULL
    );

-- 📝 Messages
-- Where the actual conversation lives
-- Think of it as a dance between humans and AIs, each taking turns to speak
CREATE TABLE
    messages (
        id TEXT PRIMARY KEY NOT NULL, -- msg-[uuid]
        content TEXT NOT NULL,
        role TEXT NOT NULL, -- 'user', 'assistant', 'system', or 'tool' - everyone's got a part to play!
        branch_id TEXT NOT NULL,
        parent_id TEXT,
        model_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES messages (id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES ai_models (id) ON DELETE SET NULL
    );

-- 🤖 AI Integration Management
-- Because one AI is never enough!
-- This is where we keep track of all our artificial friends
CREATE TABLE
    ai_integrations (
        id TEXT PRIMARY KEY NOT NULL, -- ai-[uuid]
        name TEXT NOT NULL,
        base_host TEXT NOT NULL, -- Where's the party at? (e.g., "api.openai.com")
        base_path TEXT NOT NULL, -- VIP entrance path (e.g., "/v1")
        api_key TEXT, -- Your backstage pass 🎫
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🎭 AI Models
-- The performers in our AI theater
CREATE TABLE
    ai_models (
        id TEXT PRIMARY KEY NOT NULL, -- model-[uuid]
        model_id TEXT NOT NULL, -- The model's stage name (e.g., "gpt-4")
        mynth_model_id TEXT, -- Our special nickname for them
        integration_id TEXT NOT NULL,
        FOREIGN KEY (integration_id) REFERENCES ai_integrations (id) ON DELETE CASCADE
    );

-- 🏃‍♂️ Performance Boosters
-- Because nobody likes waiting!
-- These indexes help our database find things faster than a caffeinated squirrel
CREATE INDEX idx_messages_branch_id ON messages (branch_id);

CREATE INDEX idx_branches_chat_id ON branches (chat_id);

CREATE INDEX idx_chats_parent_id ON chats (parent_id);

CREATE INDEX idx_chats_workspace_id ON chats (workspace_id);

CREATE INDEX idx_folders_workspace_id ON chat_folders (workspace_id);

CREATE INDEX idx_archived_chats ON chats (is_archived, archived_at);

CREATE INDEX idx_archived_folders ON chat_folders (is_archived, archived_at);