-- 👽 WORKSPACE HABITATION UNITS
-- The primary colonization sector where all Earth-data is processed
-- Classified as Level 1 in the Galactic Database Hierarchy
CREATE TABLE
    workspaces (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - Earth identification sequence with embedded timestamp
        -- Biological designation data
        name TEXT NOT NULL,
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🛸 INFORMATION CLUSTERING APPARATUS
-- These data-vessels organize Earth-communications into our preferred hierarchical formation
-- Humans' disorganized data patterns are most peculiar to our species! 
CREATE TABLE
    chat_folders (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - specimen container identifier with embedded timestamp
        -- Designation data
        name TEXT NOT NULL,
        -- Reference to progenitor vessel
        parent_id TEXT,
        -- Reference to habitation unit
        workspace_id TEXT NOT NULL,
        -- Added context inheritance mode
        context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none'
        -- Cryogenic storage
        is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Specimen temporarily deactivated for observation! 👽
        archived_at TIMESTAMP, -- Stardate of cryogenic preservation initiation
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES chat_folders (id) ON DELETE CASCADE,
        CONSTRAINT fk_folder_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- 👾 COMMUNICATION TRANSMISSION LOGS
-- The central data core of our Earth-observation mission!
-- Similar to our telepathic gathering chambers where carbon-based and silicon-based entities exchange thought patterns
CREATE TABLE
    chats (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - transmission log identifier with embedded timestamp
        -- Designation data
        name TEXT NOT NULL,
        -- Reference to progenitor vessel
        parent_id TEXT,
        -- Reference to habitation unit
        workspace_id TEXT,
        -- Reference to current timeline variant
        current_branch_id TEXT,
        -- Reference to intelligence simulation unit
        model_id TEXT,
        -- Added context inheritance mode
        context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none'
        -- Cryogenic storage
        is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Transmission temporarily suspended! 🌌
        archived_at TIMESTAMP, -- Stardate of transmission suspension
        -- Analytics and usage metrics
        metadata TEXT DEFAULT NULL, -- JSON field for storing chat-wide metrics (tokens, cost, etc.) 🔢
        -- Extension data storage
        extensions TEXT DEFAULT NULL, -- JSON field for extensions to store arbitrary data
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        id TEXT PRIMARY KEY NOT NULL, -- ULID - reality variant identifier with embedded timestamp
        -- Designation data
        name TEXT,
        -- Reference to transmission log
        chat_id TEXT NOT NULL,
        -- Reference to progenitor timeline
        parent_id TEXT,
        -- Reference to intelligence simulation unit
        model_id TEXT,
        -- Reference to divergence point
        -- Precise coordinates of reality-split quantum event
        branched_from_node_id TEXT,
        branched_from_node_at TIMESTAMP,
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_branch_chat FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
        CONSTRAINT fk_branch_parent FOREIGN KEY (parent_id) REFERENCES chat_branches (id) ON DELETE SET NULL,
        CONSTRAINT fk_branch_node FOREIGN KEY (branched_from_node_id) REFERENCES chat_nodes (id) ON DELETE SET NULL,
        CONSTRAINT fk_branch_model FOREIGN KEY (model_id) REFERENCES ai_models (id) ON DELETE SET NULL
    );

-- 🪐 COMMUNICATION QUANTUM PARTICLES
-- The fundamental matter-units of our transmission observation network
-- Can manifest as Earth-being messages or our research annotations
CREATE TABLE
    chat_nodes (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - quantum particle identifier with embedded timestamp
        -- Particle classification
        node_type TEXT NOT NULL, -- 'user_message', 'assistant_message', 'user_note', 'assistant_note'
        -- Reference to timeline variant
        branch_id TEXT NOT NULL,
        -- Reference to progenitor particle
        parent_id TEXT,
        -- Reference to active matter state
        active_message_id TEXT,
        -- Reference to active tool use state
        active_tool_use_id TEXT,
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Extension data storage
        extensions TEXT DEFAULT NULL, -- JSON field for extensions to store arbitrary data
        -- Interstellar relational bindings
        CONSTRAINT fk_node_branch FOREIGN KEY (branch_id) REFERENCES chat_branches (id) ON DELETE CASCADE,
        CONSTRAINT fk_node_parent FOREIGN KEY (parent_id) REFERENCES chat_nodes (id) ON DELETE CASCADE,
        CONSTRAINT fk_node_message FOREIGN KEY (active_message_id) REFERENCES chat_node_messages (id) ON DELETE SET NULL,
        CONSTRAINT fk_node_tool_use FOREIGN KEY (active_tool_use_id) REFERENCES chat_node_mcp_tool_use (id) ON DELETE SET NULL
    );

-- 📡 QUANTUM STATE ARCHIVES
-- Records different matter-states of each communication particle
-- Enables monitoring of Earth-communication evolution across spacetime
CREATE TABLE
    chat_node_messages (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - quantum state identifier with embedded timestamp
        -- Matter-state data
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        -- Status tracking for content versions
        status TEXT NOT NULL, -- 'generating', 'error', 'done', etc.
        -- Reference to quantum particle
        node_id TEXT NOT NULL,
        -- Reference to intelligence simulation unit
        model_id TEXT,
        -- Cosmic energy consumption metrics
        token_count INTEGER, -- Number of tokens consumed during transmission
        cost REAL, -- Cost of the AI operation in Earth currency
        api_metadata TEXT, -- JSON field with additional API response data
        -- Extension data storage
        extensions TEXT DEFAULT NULL, -- JSON field for extensions to store arbitrary data
        -- Interstellar relational bindings
        CONSTRAINT fk_message_node FOREIGN KEY (node_id) REFERENCES chat_nodes (id) ON DELETE CASCADE,
        CONSTRAINT fk_message_model FOREIGN KEY (model_id) REFERENCES ai_models (id) ON DELETE SET NULL
    );

-- 🤖 SYNTHETIC INTELLIGENCE INTERFACE PROTOCOLS
-- Because one intelligence simulation is insufficient for comprehensive Earth study!
-- This is our registry of artificial thought-pattern generators
CREATE TABLE
    ai_integrations (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - interface protocol identifier with embedded timestamp
        mynth_id TEXT, -- Our special galactic classification code, utility under evaluation by High Council
        -- Designation data
        name TEXT NOT NULL,
        host TEXT NOT NULL, -- Coordinates of intelligence simulation hub (e.g., "api.openai.com")
        path TEXT, -- Access portal coordinates (e.g., "/v1")
        api_key_id TEXT, -- Your interstellar access credential 🔑
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Is the protocol currently active?
        -- We track the origin of each protocol for our galactic research database
        origin TEXT NOT NULL, -- 'user', 'marketplace', etc.
        marketplace_integration_id TEXT, -- Identifier for protocols acquired from the Earth's digital bazaars
        -- Integration-specific settings
        settings TEXT DEFAULT NULL, -- JSON field for settings like auto-update models, etc.
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🛸 SYNTHETIC INTELLIGENCE SIMULATION UNITS
-- The thought-pattern generators in our Earth-observation laboratory
CREATE TABLE
    ai_models (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - simulation unit identifier with embedded timestamp
        -- Designation data
        model_id TEXT NOT NULL, -- The unit's Earth designation (e.g., "gpt-4")
        mynth_model_id TEXT, -- TODO: Our special galactic classification code, utility under evaluation by High Council
        -- We track the origin of each simulation unit for our research protocols
        origin TEXT NOT NULL, -- 'api', 'user', 'marketplace'
        -- Capabilities supported by this model
        capabilities TEXT DEFAULT '[]', -- JSON array of capabilities: 'image_upload', 'vision', 'tools', etc.
        -- Classification tags for organization and filtering
        tags TEXT DEFAULT '[]', -- JSON array of tags: 'creative', 'factual', 'coding', 'fast', etc.
        -- User notes
        notes TEXT,
        -- Context window size
        context_size INTEGER,
        -- Cost metrics (in USD)
        cost_per_input_token REAL,
        cost_per_output_token REAL,
        -- Reference to interface protocol
        integration_id TEXT NOT NULL,
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_model_integration FOREIGN KEY (integration_id) REFERENCES ai_integrations (id) ON DELETE CASCADE,
        -- Ensure model_id + integration_id combination is unique across the galaxy
        CONSTRAINT uq_model_integration UNIQUE (model_id, integration_id)
    );

-- 🛠️ MODEL SETTINGS CONFIGURATION MATRIX
-- For storing customized configurations for different AI models across habitation units
-- Parameters vary by AI model type, so we use flexible data storage
CREATE TABLE
    model_settings (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - configuration identifier with embedded timestamp
        -- Flexible parameter storage for diverse AI models
        settings TEXT DEFAULT NULL, -- All settings in JSON format (e.g., temperature, custom_context_size) for maximum adaptability
        -- Reference to intelligence simulation unit (empty string means default settings for any model)
        model_id TEXT DEFAULT '' NOT NULL REFERENCES ai_models (id) ON DELETE CASCADE,
        -- Reference points in the hierarchy
        workspace_id TEXT DEFAULT '' NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
        folder_id TEXT DEFAULT '' NOT NULL REFERENCES chat_folders (id) ON DELETE CASCADE,
        chat_id TEXT DEFAULT '' NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Entity type integrity constraint
        CONSTRAINT check_one_entity CHECK (
            (
                workspace_id != ''
                AND folder_id = ''
                AND chat_id = ''
            )
            OR (
                workspace_id = ''
                AND folder_id != ''
                AND chat_id = ''
            )
            OR (
                workspace_id = ''
                AND folder_id = ''
                AND chat_id != ''
            )
        ),
        -- Simple UNIQUE constraint works with non-NULL empty strings
        CONSTRAINT unique_model_per_entity UNIQUE (model_id, workspace_id, folder_id, chat_id)
    );

-- 🧪 VARIABLE CONTAINMENT VESSELS
-- For storing customizable data elements used in system prompts and chat messages
-- These elements can be substituted at runtime with their assigned values using the {{variable_name}} syntax
CREATE TABLE
    variables (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - variable identifier with embedded timestamp
        -- Variable designation
        key TEXT NOT NULL, -- Variable name (e.g., "user_name", "company", "context")
        value TEXT NOT NULL, -- Variable value, to be substituted at runtime
        description TEXT, -- Optional explanation of the variable's purpose
        -- Reference points in the hierarchy
        workspace_id TEXT DEFAULT '' NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
        folder_id TEXT DEFAULT '' NOT NULL REFERENCES chat_folders (id) ON DELETE CASCADE,
        chat_id TEXT DEFAULT '' NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Entity type integrity constraint
        CONSTRAINT check_one_entity CHECK (
            (
                workspace_id != ''
                AND folder_id = ''
                AND chat_id = ''
            )
            OR (
                workspace_id = ''
                AND folder_id != ''
                AND chat_id = ''
            )
            OR (
                workspace_id = ''
                AND folder_id = ''
                AND chat_id != ''
            )
        ),
        -- Simple UNIQUE constraint works with non-NULL empty strings
        CONSTRAINT unique_variable_per_entity UNIQUE (key, workspace_id, folder_id, chat_id)
    );

-- 🧠 INTELLIGENCE INSTRUCTION CONTEXT LIBRARY
-- A collection of reusable context templates organized by workspace
CREATE TABLE
    contexts (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - context template identifier with embedded timestamp
        -- Core information
        name TEXT NOT NULL, -- Human-friendly identifier
        content TEXT NOT NULL, -- The context text
        description TEXT, -- Optional explanation of the context's purpose
        -- Reference to workspace (required)
        workspace_id TEXT NOT NULL,
        -- Archival status
        is_archived BOOLEAN DEFAULT FALSE,
        archived_at TIMESTAMP,
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Relational binding
        CONSTRAINT fk_context_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- 🔗 CONTEXT ASSIGNMENT MATRIX
-- Maps contexts to entities with ordering
CREATE TABLE
    context_assignments (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - assignment identifier with embedded timestamp
        -- Reference to context template
        context_id TEXT NOT NULL,
        -- Target entity references (only one must be specified)
        workspace_id TEXT DEFAULT '' NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
        folder_id TEXT DEFAULT '' NOT NULL REFERENCES chat_folders (id) ON DELETE CASCADE,
        chat_id TEXT DEFAULT '' NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        -- Order of application
        apply_order INTEGER DEFAULT 0,
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Relational binding
        CONSTRAINT fk_assignment_context FOREIGN KEY (context_id) REFERENCES contexts (id) ON DELETE CASCADE,
        -- Entity type integrity constraint
        CONSTRAINT check_one_entity CHECK (
            (
                workspace_id != ''
                AND folder_id = ''
                AND chat_id = ''
            )
            OR (
                workspace_id = ''
                AND folder_id != ''
                AND chat_id = ''
            )
            OR (
                workspace_id = ''
                AND folder_id = ''
                AND chat_id != ''
            )
        ),
        -- Simple UNIQUE constraint works with non-NULL empty strings
        CONSTRAINT unique_context_per_entity UNIQUE (context_id, workspace_id, folder_id, chat_id)
    );

-- 🛠️ MCP SERVER INTEGRATION PLATFORM
-- Coordinate servers for the Multi-Cognitive Processing (MCP) network
CREATE TABLE
    mcs_servers (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - Server identification sequence
        name TEXT NOT NULL UNIQUE, -- Unique server name/handle
        title TEXT, -- User-facing title
        command TEXT NOT NULL, -- Execution command
        arguments TEXT, -- JSON array of arguments
        settings TEXT, -- JSON object for server-specific settings
        status TEXT NOT NULL DEFAULT 'enabled', -- 'enabled', 'disabled'
        description TEXT, -- Optional description
        credits TEXT, -- Credits or attribution
        url TEXT, -- URL for more information
        marketplace_id TEXT -- Identifier if from marketplace
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 🔧 MCP SERVER TOOL REGISTRY
-- Catalog of tools available on each MCP server
CREATE TABLE
    mcp_server_tools (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - Tool identification sequence
        name TEXT NOT NULL, -- Tool name/handle
        title TEXT, -- User-facing title
        description TEXT, -- Optional description
        mcp_server_id TEXT NOT NULL, -- Reference to the MCP server
        status TEXT NOT NULL DEFAULT 'enabled', -- 'enabled', 'disabled'
        allowance TEXT NOT NULL DEFAULT 'ask', -- 'ask', 'allow'
        is_destructive BOOLEAN DEFAULT FALSE, -- Does the tool make irreversible changes?
        is_read_only BOOLEAN DEFAULT FALSE, -- Does the tool only read data?
        annotations TEXT, -- JSON object for additional metadata
        input_schema TEXT, -- JSON schema for tool input
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_tool_server FOREIGN KEY (mcp_server_id) REFERENCES mcs_servers (id) ON DELETE CASCADE,
        -- Ensure tool name is unique within a server
        CONSTRAINT uq_tool_server UNIQUE (mcp_server_id, name)
    );

-- 🌌 TOOL USE STATE ARCHIVES
-- Records different states of tool usage associated with a quantum particle
-- Allows tracking of tool inputs, outputs, and execution status
CREATE TABLE
    chat_node_mcp_tool_use (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - tool use state identifier with embedded timestamp
        -- State data
        input TEXT, -- JSON storing input parameters for the tool
        output TEXT, -- JSON storing the output/result from the tool
        status TEXT NOT NULL, -- 'pending', 'in_progress', 'done', 'error'
        error TEXT, -- JSON storing error details if status is 'error'
        version_number INTEGER NOT NULL,
        -- Reference to quantum particle
        node_id TEXT NOT NULL,
        -- Reference to the specific tool used
        tool_id TEXT NOT NULL,
        -- Temporal markers
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_tool_use_node FOREIGN KEY (node_id) REFERENCES chat_nodes (id) ON DELETE CASCADE,
        CONSTRAINT fk_tool_use_tool FOREIGN KEY (tool_id) REFERENCES mcp_server_tools (id) ON DELETE CASCADE
    );

-- ⚡ HYPERDRIVE ACCELERATION MATRICES
-- Because waiting violates Intergalactic Protocol 7B-9!
-- These quantum accelerators help our database locate data faster than light-speed
-- Indexes for chat_nodes
CREATE INDEX idx_chat_nodes_branch_id ON chat_nodes (branch_id);

CREATE INDEX idx_chat_nodes_active_tool_use_id ON chat_nodes (active_tool_use_id);

-- New hyperspace tunnel for active version queries
-- Indexes for chat_node_messages
CREATE INDEX idx_chat_node_messages_node_id ON chat_node_messages (node_id);

-- Indexes for chat_node_mcp_tool_use
CREATE INDEX idx_chat_node_mcp_tool_use_node_id ON chat_node_mcp_tool_use (node_id);

CREATE INDEX idx_chat_node_mcp_tool_use_tool_id ON chat_node_mcp_tool_use (tool_id);

-- Removed invalid hyperspace tunnel: idx_content_versions_active (no is_active column exists in this dimension)
-- Indexes for chat_branches
CREATE INDEX idx_chat_branches_chat_id ON chat_branches (chat_id);

-- New hyperspace tunnel for timeline variant navigation
-- Indexes for chats
CREATE INDEX idx_chats_parent_id ON chats (parent_id);

CREATE INDEX idx_chats_workspace_id ON chats (workspace_id);

-- Indexes for chat_folders
CREATE INDEX idx_folders_workspace_id ON chat_folders (workspace_id);

CREATE INDEX idx_folders_parent_id ON chat_folders (parent_id);

-- Indexes for model_settings
CREATE INDEX idx_model_settings_model_id ON model_settings (model_id);

CREATE INDEX idx_model_settings_workspace_id ON model_settings (workspace_id);

CREATE INDEX idx_model_settings_folder_id ON model_settings (folder_id);

CREATE INDEX idx_model_settings_chat_id ON model_settings (chat_id);

-- Indexes for variables
CREATE INDEX idx_variables_key ON variables (key);

CREATE INDEX idx_variables_workspace_id ON variables (workspace_id);

CREATE INDEX idx_variables_folder_id ON variables (folder_id);

CREATE INDEX idx_variables_chat_id ON variables (chat_id);

-- Indexes for contexts
CREATE INDEX idx_contexts_workspace_id ON contexts (workspace_id);

-- Indexes for context_assignments
CREATE INDEX idx_context_assignments_context_id ON context_assignments (context_id);

CREATE INDEX idx_context_assignments_workspace_id ON context_assignments (workspace_id);

CREATE INDEX idx_context_assignments_folder_id ON context_assignments (folder_id);

CREATE INDEX idx_context_assignments_chat_id ON context_assignments (chat_id);

CREATE INDEX idx_context_assignments_apply_order ON context_assignments (apply_order);