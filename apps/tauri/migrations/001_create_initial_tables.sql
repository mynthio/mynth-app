-- 👽 WORKSPACE HABITATION UNITS
-- The primary colonization sector where all Earth-data is processed
-- Classified as Level 1 in the Galactic Database Hierarchy
CREATE TABLE
    workspaces (
        id TEXT PRIMARY KEY NOT NULL, -- workspace-[uuid] - Earth identification sequence
        -- Biological designation data
        name TEXT NOT NULL,
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🛸 INFORMATION CLUSTERING APPARATUS
-- These data-vessels organize Earth-communications into our preferred hierarchical formation
-- Humans' disorganized data patterns are most peculiar to our species! 
CREATE TABLE
    chat_folders (
        id TEXT PRIMARY KEY NOT NULL, -- folder-[uuid] - specimen container identifier
        -- Designation data
        name TEXT NOT NULL,
        -- Reference to progenitor vessel
        parent_id TEXT,
        -- Reference to habitation unit
        workspace_id TEXT NOT NULL,
        -- Cryogenic storage
        is_archived BOOLEAN DEFAULT FALSE, -- Specimen temporarily deactivated for observation! 👽
        archived_at TIMESTAMP, -- Stardate of cryogenic preservation initiation
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES chat_folders (id) ON DELETE CASCADE,
        CONSTRAINT fk_folder_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- 👾 COMMUNICATION TRANSMISSION LOGS
-- The central data core of our Earth-observation mission!
-- Similar to our telepathic gathering chambers where carbon-based and silicon-based entities exchange thought patterns
CREATE TABLE
    chats (
        id TEXT PRIMARY KEY NOT NULL, -- chat-[uuid] - transmission log identifier
        -- Designation data
        name TEXT NOT NULL,
        -- Reference to progenitor vessel
        parent_id TEXT,
        -- Reference to habitation unit
        workspace_id TEXT,
        -- Reference to current timeline variant
        current_branch_id TEXT,
        -- Cryogenic storage
        is_archived BOOLEAN DEFAULT FALSE, -- Transmission temporarily suspended! 🌌
        archived_at TIMESTAMP, -- Stardate of transmission suspension
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_chat_parent FOREIGN KEY (parent_id) REFERENCES chat_folders (id) ON DELETE CASCADE,
        CONSTRAINT fk_chat_branch FOREIGN KEY (current_branch_id) REFERENCES chat_branches (id) ON DELETE SET NULL,
        CONSTRAINT fk_chat_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- 🌠 TIMELINE DIVERGENCE APPARATUS
-- For creating alternate reality simulations of Earth-communications
-- Reminiscent of our quantum probability manipulators from Dimension X-7
-- Each timeline variant inherits cosmic patterns from its progenitor!
CREATE TABLE
    chat_branches (
        id TEXT PRIMARY KEY NOT NULL, -- branch-[uuid] - reality variant identifier
        -- Designation data
        name TEXT,
        -- Reference to transmission log
        chat_id TEXT NOT NULL,
        -- Reference to progenitor timeline
        parent_id TEXT,
        -- Reference to divergence point
        -- Precise coordinates of reality-split quantum event
        branched_from_node_id TEXT,
        branched_from_node_at TIMESTAMP,
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_branch_chat FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
        CONSTRAINT fk_branch_parent FOREIGN KEY (parent_id) REFERENCES chat_branches (id) ON DELETE SET NULL,
        CONSTRAINT fk_branch_node FOREIGN KEY (branched_from_node_id) REFERENCES chat_nodes (id) ON DELETE SET NULL
    );

-- 🪐 COMMUNICATION QUANTUM PARTICLES
-- The fundamental matter-units of our transmission observation network
-- Can manifest as Earth-being messages or our research annotations
CREATE TABLE
    chat_nodes (
        id TEXT PRIMARY KEY NOT NULL, -- node-[uuid] - quantum particle identifier
        -- Particle classification
        node_type TEXT NOT NULL, -- 'user_message', 'assistant_message', 'user_note', 'assistant_note'
        -- Reference to timeline variant
        branch_id TEXT NOT NULL,
        -- Reference to progenitor particle
        parent_id TEXT,
        -- Reference to intelligence simulation unit
        model_id TEXT,
        -- Reference to active matter state
        active_version_id TEXT,
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_node_branch FOREIGN KEY (branch_id) REFERENCES chat_branches (id) ON DELETE CASCADE,
        CONSTRAINT fk_node_parent FOREIGN KEY (parent_id) REFERENCES chat_nodes (id) ON DELETE CASCADE,
        CONSTRAINT fk_node_model FOREIGN KEY (model_id) REFERENCES ai_models (id) ON DELETE SET NULL,
        CONSTRAINT fk_node_version FOREIGN KEY (active_version_id) REFERENCES chat_node_content_versions (id) ON DELETE SET NULL
    );

-- 📡 QUANTUM STATE ARCHIVES
-- Records different matter-states of each communication particle
-- Enables monitoring of Earth-communication evolution across spacetime
CREATE TABLE
    chat_node_content_versions (
        id TEXT PRIMARY KEY NOT NULL, -- cv-[uuid] - quantum state identifier
        -- Matter-state data
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        -- Reference to quantum particle
        node_id TEXT NOT NULL,
        -- Temporal marker for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational binding
        CONSTRAINT fk_version_node FOREIGN KEY (node_id) REFERENCES chat_nodes (id) ON DELETE CASCADE
    );

-- 🤖 SYNTHETIC INTELLIGENCE INTERFACE PROTOCOLS
-- Because one intelligence simulation is insufficient for comprehensive Earth study!
-- This is our registry of artificial thought-pattern generators
CREATE TABLE
    ai_integrations (
        id TEXT PRIMARY KEY NOT NULL, -- ai-[uuid] - interface protocol identifier
        -- Designation data
        name TEXT NOT NULL,
        base_host TEXT NOT NULL, -- Coordinates of intelligence simulation hub (e.g., "api.openai.com")
        base_path TEXT NOT NULL, -- Access portal coordinates (e.g., "/v1")
        api_key TEXT, -- Your interstellar access credential 🔑
        is_enabled BOOLEAN DEFAULT TRUE, -- Is the protocol currently active?
        -- We track the origin of each protocol for our galactic research database
        origin TEXT NOT NULL, -- 'user', 'marketplace', etc.
        marketplace_integration_id TEXT, -- Identifier for protocols acquired from the Earth's digital bazaars
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🛸 SYNTHETIC INTELLIGENCE SIMULATION UNITS
-- The thought-pattern generators in our Earth-observation laboratory
CREATE TABLE
    ai_models (
        id TEXT PRIMARY KEY NOT NULL, -- model-[uuid] - simulation unit identifier
        -- Designation data
        model_id TEXT NOT NULL, -- The unit's Earth designation (e.g., "gpt-4")
        mynth_model_id TEXT, -- TODO: Our special galactic classification code, utility under evaluation by High Council
        -- We track the origin of each simulation unit for our research protocols
        origin TEXT NOT NULL, -- 'api', 'user', 'marketplace'
        -- Reference to interface protocol
        integration_id TEXT NOT NULL,
        -- Temporal markers for specimen tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_model_integration FOREIGN KEY (integration_id) REFERENCES ai_integrations (id) ON DELETE CASCADE,
        -- Ensure model_id + integration_id combination is unique across the galaxy
        CONSTRAINT uq_model_integration UNIQUE (model_id, integration_id)
    );

-- ⚡ HYPERDRIVE ACCELERATION MATRICES
-- Because waiting violates Intergalactic Protocol 7B-9!
-- These quantum accelerators help our database locate data faster than light-speed
-- Indexes for chat_nodes
CREATE INDEX idx_chat_nodes_branch_id ON chat_nodes (branch_id);

CREATE INDEX idx_chat_nodes_parent_id ON chat_nodes (parent_id);

CREATE INDEX idx_chat_nodes_node_type ON chat_nodes (node_type);

CREATE INDEX idx_chat_nodes_active_version_id ON chat_nodes (active_version_id);

-- New hyperspace tunnel for active version queries
-- Indexes for chat_node_content_versions
CREATE INDEX idx_chat_node_content_versions_node_id ON chat_node_content_versions (node_id);

-- Removed invalid hyperspace tunnel: idx_content_versions_active (no is_active column exists in this dimension)
-- Indexes for chat_branches
CREATE INDEX idx_chat_branches_chat_id ON chat_branches (chat_id);

CREATE INDEX idx_chat_branches_parent_id ON chat_branches (parent_id);

-- New hyperspace tunnel for timeline variant navigation
-- Indexes for chats
CREATE INDEX idx_chats_parent_id ON chats (parent_id);

CREATE INDEX idx_chats_workspace_id ON chats (workspace_id);

-- Indexes for chat_folders
CREATE INDEX idx_folders_workspace_id ON chat_folders (workspace_id);

CREATE INDEX idx_folders_parent_id ON chat_folders (parent_id);