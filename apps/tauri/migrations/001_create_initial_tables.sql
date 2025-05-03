-- 👽 WORKSPACE HABITATION UNITS
-- The primary colonization sector where all Earth-data is processed
-- Classified as Level 1 in the Galactic Database Hierarchy
CREATE TABLE
    workspaces (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - Earth identification sequence with embedded timestamp
        -- Biological designation data
        name TEXT NOT NULL,
        -- Flexible context for this workspace (e.g., system prompt, docs, files in future)
        context TEXT DEFAULT NULL, -- Context can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
        -- How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
        context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none', 'workspace'. 'workspace' means inherit from workspace.
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Indexes for workspaces (for future-proofing your galactic queries)
-- (None needed yet, but if your colony grows, revisit this sector!)
-- 🛸 INFORMATION CLUSTERING APPARATUS
-- These data-vessels organize Earth-communications into our preferred hierarchical formation
-- Humans' disorganized data patterns are most peculiar to our species! 
CREATE TABLE
    chat_folders (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - specimen container identifier with embedded timestamp
        -- Designation data
        name TEXT NOT NULL,
        -- Reference to progenitor vessel
        parent_id TEXT, -- The parent folder in the cosmic hierarchy (NULL if root)
        -- Reference to habitation unit
        workspace_id TEXT NOT NULL, -- The workspace this folder belongs to
        -- Flexible context for this folder (e.g., system prompt, docs, files in future)
        context TEXT DEFAULT NULL, -- Context can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
        -- How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
        context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none', 'workspace'. 'workspace' means inherit from workspace.
        -- Cryogenic storage
        is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Specimen temporarily deactivated for observation! 👽
        archived_at TIMESTAMP, -- Stardate of cryogenic preservation initiation
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES chat_folders (id) ON DELETE CASCADE,
        CONSTRAINT fk_folder_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

-- Indexes for chat_folders (for warp-speed folder lookups)
CREATE INDEX idx_folders_workspace_id ON chat_folders (workspace_id);

-- Find all folders in a workspace at light speed
CREATE INDEX idx_folders_parent_id ON chat_folders (parent_id);

-- Traverse the folder nebula
-- 👾 COMMUNICATION TRANSMISSION LOGS
-- The central data core of our Earth-observation mission!
-- Similar to our telepathic gathering chambers where carbon-based and silicon-based entities exchange thought patterns
CREATE TABLE
    chats (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - transmission log identifier with embedded timestamp
        -- Designation data
        name TEXT NOT NULL,
        -- Reference to progenitor vessel
        parent_id TEXT, -- The parent folder for this chat (NULL if root)
        -- Reference to habitation unit
        workspace_id TEXT, -- The workspace this chat belongs to
        -- Reference to current timeline variant
        current_branch_id TEXT, -- The current timeline branch (for quantum chat adventures)
        -- Reference to intelligence simulation unit
        model_id TEXT, -- The AI model currently piloting this chat
        -- Flexible context for this chat (e.g., system prompt, docs, files in future)
        context TEXT DEFAULT NULL, -- Context can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
        -- How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
        context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none', 'workspace'. 'workspace' means inherit from workspace.
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

-- Indexes for chats (for hyperdrive chat navigation)
CREATE INDEX idx_chats_parent_id ON chats (parent_id);

-- Find all chats in a folder
CREATE INDEX idx_chats_workspace_id ON chats (workspace_id);

-- Find all chats in a workspace
-- 🌠 TIMELINE DIVERGENCE APPARATUS
-- For creating alternate reality simulations of Earth-communications
-- Reminiscent of our quantum probability manipulators from Dimension X-7
-- Each timeline variant inherits cosmic patterns from its progenitor!
CREATE TABLE
    chat_branches (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - reality variant identifier with embedded timestamp
        -- Designation data
        name TEXT, -- Name of this timeline branch (optional, for creative aliens)
        -- Reference to transmission log
        chat_id TEXT NOT NULL, -- The chat this branch belongs to
        -- Reference to progenitor timeline
        parent_id TEXT, -- The parent branch (NULL if original timeline)
        -- Reference to intelligence simulation unit
        model_id TEXT, -- The AI model piloting this branch
        -- Flexible context for this branch (e.g., system prompt, docs, files in future)
        context TEXT DEFAULT NULL, -- Context can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
        -- How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
        context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none', 'workspace'. 'workspace' means inherit from workspace.
        -- Reference to divergence point
        -- Precise coordinates of reality-split quantum event
        branched_from_node_id TEXT, -- The node where this branch diverged
        branched_from_node_at TIMESTAMP, -- Stardate of divergence
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_branch_chat FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
        CONSTRAINT fk_branch_parent FOREIGN KEY (parent_id) REFERENCES chat_branches (id) ON DELETE SET NULL,
        CONSTRAINT fk_branch_node FOREIGN KEY (branched_from_node_id) REFERENCES chat_nodes (id) ON DELETE SET NULL,
        CONSTRAINT fk_branch_model FOREIGN KEY (model_id) REFERENCES ai_models (id) ON DELETE SET NULL
    );

-- Indexes for chat_branches (for multiverse navigation)
CREATE INDEX idx_chat_branches_chat_id ON chat_branches (chat_id);

-- Find all branches for a chat
-- 🪐 COMMUNICATION QUANTUM PARTICLES
-- The fundamental matter-units of our transmission observation network
-- Can manifest as Earth-being messages or our research annotations
CREATE TABLE
    chat_nodes (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - quantum particle identifier with embedded timestamp
        -- Particle classification
        node_type TEXT NOT NULL, -- 'user_message', 'assistant_message', 'user_note', 'assistant_note'
        -- Reference to timeline variant
        branch_id TEXT NOT NULL, -- The timeline branch this node belongs to
        -- Reference to progenitor particle
        parent_id TEXT, -- The parent node (NULL if root particle)
        -- Reference to active matter state
        active_message_id TEXT, -- The currently active message for this node
        -- Reference to active tool use state
        active_tool_use_id TEXT, -- The currently active tool use for this node
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

-- Indexes for chat_nodes (for quantum entanglement lookups)
CREATE INDEX idx_chat_nodes_branch_id ON chat_nodes (branch_id);

-- Find all nodes in a branch
-- 📡 QUANTUM STATE ARCHIVES
-- Records different matter-states of each communication particle
-- Enables monitoring of Earth-communication evolution across spacetime
CREATE TABLE
    chat_node_messages (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - quantum state identifier with embedded timestamp
        -- Matter-state data
        content TEXT NOT NULL, -- The actual message content (Earthling or alien)
        version_number INTEGER NOT NULL, -- Version of this message state (for time-travel debugging)
        -- Status tracking for content versions
        status TEXT NOT NULL, -- 'generating', 'error', 'done', etc. (galactic status codes)
        -- Reference to quantum particle
        node_id TEXT NOT NULL, -- The node this message belongs to
        -- Reference to intelligence simulation unit
        model_id TEXT, -- The AI model that generated this message
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

-- Indexes for chat_node_messages (for state evolution at warp speed)
CREATE INDEX idx_chat_node_messages_node_id ON chat_node_messages (node_id);

-- Find all messages for a node
-- 🤖 SYNTHETIC INTELLIGENCE INTERFACE PROTOCOLS
-- Because one intelligence simulation is insufficient for comprehensive Earth study!
-- This is our registry of artificial thought-pattern generators
CREATE TABLE
    ai_integrations (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - interface protocol identifier with embedded timestamp
        mynth_id TEXT, -- Our special galactic classification code, utility under evaluation by High Council
        -- Designation data
        display_name TEXT NOT NULL,
        host TEXT NOT NULL, -- Coordinates of intelligence simulation hub (e.g., "api.openai.com")
        base_path TEXT, -- Access portal coordinates (e.g., "/v1")
        -- Paths by type
        chat_completion_path TEXT, -- Path to the chat completion endpoint
        -- API key
        api_key_id TEXT, -- Your interstellar access credential 🔑
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Is the protocol currently active?
        is_custom BOOLEAN NOT NULL DEFAULT TRUE, -- Is this a custom integration?
        -- We track the origin of each protocol for our galactic research database
        marketplace_integration_id TEXT, -- Identifier for protocols acquired from the Earth's digital bazaars
        -- Integration-specific settings
        settings TEXT DEFAULT NULL, -- JSON field for settings like auto-update models, etc.
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- No indexes for ai_integrations yet (aliens are still evaluating the need)
-- 🛸 SYNTHETIC INTELLIGENCE SIMULATION UNITS
-- The thought-pattern generators in our Earth-observation laboratory
CREATE TABLE
    ai_models (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - simulation unit identifier with embedded timestamp
        -- Designation data
        model_id TEXT NOT NULL, -- The unit's Earth designation (e.g., "gpt-4")
        mynth_model_id TEXT, -- Our special galactic classification code, utility under evaluation by High Council
        path TEXT, -- Access portal coordinates (e.g., "/chat/completions")
        display_name TEXT, -- User-friendly name for the model
        -- We track the origin of each simulation unit for our research protocols
        is_custom BOOLEAN NOT NULL DEFAULT FALSE, -- Is this a custom model?
        -- Capabilities supported by this model
        capabilities TEXT DEFAULT '[]', -- JSON array of capabilities: 'image_upload', 'vision', 'tools', etc.
        -- Classification tags for organization and filtering
        tags TEXT DEFAULT '[]', -- JSON array of tags: 'creative', 'factual', 'coding', 'fast', etc.
        metadata TEXT DEFAULT NULL, -- JSON field for storing arbitrary metadata
        -- User notes
        notes TEXT, -- Notes for galactic researchers
        -- Context window size
        max_context_size INTEGER, -- Maximum context window for this model
        -- Cost metrics (in USD)
        cost_per_input_token REAL, -- Cost per input token (Earth currency)
        cost_per_output_token REAL, -- Cost per output token (Earth currency)
        -- Settings for this model
        settings TEXT DEFAULT NULL, -- JSON field for settings like temperature, custom_context_size, etc.
        -- Reference to interface protocol
        integration_id TEXT NOT NULL, -- The integration this model belongs to
        -- Temporal markers for specimen tracking
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_model_integration FOREIGN KEY (integration_id) REFERENCES ai_integrations (id) ON DELETE CASCADE,
        -- Ensure model_id + integration_id combination is unique across the galaxy
        CONSTRAINT uq_model_integration UNIQUE (model_id, integration_id)
    );

-- Find all settings for a chat
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

-- Indexes for variables (for variable substitution at light speed)
CREATE INDEX idx_variables_key ON variables (key);

-- Find variables by key
CREATE INDEX idx_variables_workspace_id ON variables (workspace_id);

-- Find variables for a workspace
CREATE INDEX idx_variables_folder_id ON variables (folder_id);

-- Find variables for a folder
CREATE INDEX idx_variables_chat_id ON variables (chat_id);

-- Find variables for a chat
-- 🛠️ MCP SERVER INTEGRATION PLATFORM
-- Coordinate servers for the Multi-Cognitive Processing (MCP) network
CREATE TABLE
    mcs_servers (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - Server identification sequence
        name TEXT NOT NULL UNIQUE, -- Unique server name/handle
        display_name TEXT, -- User-facing title
        command TEXT NOT NULL, -- Execution command
        arguments TEXT, -- JSON array of arguments
        env TEXT, -- JSON object for environment variables
        settings TEXT, -- JSON object for server-specific settings
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Is this server currently active?
        is_custom BOOLEAN NOT NULL DEFAULT TRUE, -- Is this a custom server?
        description TEXT, -- Optional description
        credits TEXT, -- Credits or attribution
        url TEXT, -- URL for more information
        marketplace_id TEXT, -- Identifier if from marketplace
        metadata TEXT, -- JSON object for arbitrary metadata
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- No indexes for mcs_servers yet (aliens are still negotiating with the MCP)
-- 🔧 MCP SERVER TOOL REGISTRY
-- Catalog of tools available on each MCP server
CREATE TABLE
    mcp_server_tools (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - Tool identification sequence
        name TEXT NOT NULL, -- Tool name/handle
        display_name TEXT, -- User-facing title
        description TEXT, -- Optional description
        mcp_server_id TEXT NOT NULL, -- Reference to the MCP server
        status TEXT NOT NULL DEFAULT 'enabled', -- 'enabled', 'disabled'
        allowance TEXT NOT NULL DEFAULT 'ask', -- 'ask', 'allow'
        is_destructive BOOLEAN DEFAULT FALSE, -- Does the tool make irreversible changes?
        is_read_only BOOLEAN DEFAULT FALSE, -- Does the tool only read data?
        annotations TEXT, -- JSON object for additional metadata
        input_schema TEXT, -- JSON schema for tool input
        metadata TEXT, -- JSON object for arbitrary metadata
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_tool_server FOREIGN KEY (mcp_server_id) REFERENCES mcs_servers (id) ON DELETE CASCADE,
        -- Ensure tool name is unique within a server
        CONSTRAINT uq_tool_server UNIQUE (mcp_server_id, name)
    );

-- No indexes for mcp_server_tools yet (galactic tool registry is still small)
-- 🌌 TOOL USE STATE ARCHIVES
-- Records different states of tool usage associated with a quantum particle
-- Allows tracking of tool inputs, outputs, and execution status
CREATE TABLE
    chat_node_mcp_tool_use (
        id TEXT PRIMARY KEY NOT NULL, -- ULID - tool use state identifier with embedded timestamp
        -- State data
        status TEXT NOT NULL, -- 'pending', 'in_progress', 'done', 'error' (galactic status codes)
        input TEXT, -- JSON storing input parameters for the tool
        output TEXT, -- JSON storing the output/result from the tool
        error TEXT, -- JSON storing error details if status is 'error'
        version_number INTEGER NOT NULL, -- Version of this tool use state
        -- Reference to quantum particle
        node_id TEXT NOT NULL, -- The node this tool use belongs to
        -- Reference to the specific tool used
        tool_id TEXT NOT NULL, -- The tool used in this operation
        -- Temporal markers
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Interstellar relational bindings
        CONSTRAINT fk_tool_use_node FOREIGN KEY (node_id) REFERENCES chat_nodes (id) ON DELETE CASCADE,
        CONSTRAINT fk_tool_use_tool FOREIGN KEY (tool_id) REFERENCES mcp_server_tools (id) ON DELETE CASCADE
    );

-- Indexes for chat_node_mcp_tool_use (for tool use tracking at galactic scale)
CREATE INDEX idx_chat_node_mcp_tool_use_node_id ON chat_node_mcp_tool_use (node_id);

-- Find all tool uses for a node
CREATE INDEX idx_chat_node_mcp_tool_use_tool_id ON chat_node_mcp_tool_use (tool_id);