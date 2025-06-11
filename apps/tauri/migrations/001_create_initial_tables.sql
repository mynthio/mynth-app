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
    json_config TEXT NOT NULL DEFAULT '{}', -- JSON field for storing arbitrary configuration data
    -- Temporal markers for specimen tracking
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes for workspaces (for future-proofing your galactic queries)
-- (None needed yet, but if your colony grows, revisit this sector!)
-- 🛸 INFORMATION CLUSTERING APPARATUS
-- These data-vessels organize Earth-communications into our preferred hierarchical formation
-- Humans' disorganized data patterns are most peculiar to our species!
CREATE TABLE
  folders (
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
    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE,
    CONSTRAINT fk_folder_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
  );

-- Indexes for folders (for warp-speed folder lookups)
CREATE INDEX idx_folders_workspace_id ON folders (workspace_id);

-- Find all folders in a workspace at light speed
CREATE INDEX idx_folders_parent_id ON folders (parent_id);

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
    workspace_id TEXT NOT NULL, -- The workspace this chat belongs to
    -- Reference to current timeline variant
    current_branch_id TEXT, -- The current timeline branch (for quantum chat adventures)
    -- Flexible context for this chat (e.g., system prompt, docs, files in future)
    context TEXT DEFAULT NULL, -- Context can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
    -- How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
    context_inheritance_mode TEXT NOT NULL DEFAULT 'inherit', -- 'inherit', 'override', 'none', 'workspace'. 'workspace' means inherit from workspace.
    -- MCP (Multi-Cognitive Processing) settings
    mcp_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Whether MCP tools and servers are enabled for this chat
    -- Cryogenic storage
    is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Transmission temporarily suspended! 🌌
    archived_at TIMESTAMP, -- Stardate of transmission suspension
    -- Analytics and usage metrics
    json_metadata TEXT DEFAULT NULL, -- JSON field for storing chat-wide metrics (tokens, cost, etc.) 🔢
    -- Extension data storage
    json_extensions TEXT DEFAULT NULL, -- JSON field for extensions to store arbitrary data
    -- Temporal markers for specimen tracking
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Interstellar relational bindings
    CONSTRAINT fk_chat_parent FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_branch FOREIGN KEY (current_branch_id) REFERENCES branches (id) ON DELETE SET NULL,
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
  branches (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - reality variant identifier with embedded timestamp
    -- Designation data
    name TEXT, -- Name of this timeline branch (optional, for creative aliens)
    -- Reference to transmission log
    chat_id TEXT NOT NULL, -- The chat this branch belongs to
    -- Reference to progenitor timeline
    parent_id TEXT, -- The parent branch (NULL if original timeline)
    -- Reference to intelligence simulation unit
    model_id TEXT, -- The AI model piloting this branch
    -- Temporal markers for specimen tracking
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Interstellar relational bindings
    CONSTRAINT fk_branch_chat FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
    CONSTRAINT fk_branch_parent FOREIGN KEY (parent_id) REFERENCES branches (id) ON DELETE SET NULL,
    CONSTRAINT fk_branch_model FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE SET NULL
  );

-- Indexes for branches (for multiverse navigation)
CREATE INDEX idx_branches_chat_id ON branches (chat_id);

-- Find all branches for a chat
-- 🪐 COMMUNICATION QUANTUM PARTICLES
-- The fundamental matter-units of our transmission observation network
-- Can manifest as Earth-being messages or our research annotations
CREATE TABLE
  nodes (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - quantum particle identifier with embedded timestamp
    -- Particle classification
    type TEXT NOT NULL, -- 'message', 'note', 'tool_call', 'tool_result'
    -- Role
    role TEXT NOT NULL, -- 'user', 'assistant'
    -- Reference to timeline variant
    branch_id TEXT NOT NULL, -- The timeline branch this node belongs to
    -- Reference to active matter state
    active_version_id TEXT, -- The currently active version for this node
    -- Temporal markers for specimen tracking
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Extension data storage
    extensions TEXT DEFAULT NULL, -- JSON field for extensions to store arbitrary data
    -- Interstellar relational bindings
    CONSTRAINT fk_node_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
    CONSTRAINT fk_node_version FOREIGN KEY (active_version_id) REFERENCES node_versions (id) ON DELETE SET NULL
  );

-- Indexes for nodes (for quantum entanglement lookups)
CREATE INDEX idx_nodes_branch_id ON nodes (branch_id);

-- Find all nodes in a branch
-- 📡 QUANTUM STATE ARCHIVES
-- Records different matter-states of each communication particle
-- Enables monitoring of Earth-communication evolution across spacetime
CREATE TABLE
  node_versions (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - quantum state identifier with embedded timestamp
    -- Matter-state data
    content TEXT NOT NULL, -- The actual message content (Earthling or alien)
    version_number INTEGER NOT NULL DEFAULT 0, -- Version of this message state (for time-travel debugging)
    -- Status tracking for content versions
    status TEXT NOT NULL, -- 'generating', 'error', 'done', etc. (galactic status codes)
    -- Reference to quantum particle
    node_id TEXT NOT NULL, -- The node this message belongs to
    -- Reference to intelligence simulation unit
    model_id TEXT, -- The AI model that generated this message
    -- Cosmic energy consumption metrics
    token_count INTEGER, -- Number of tokens consumed during transmission
    cost REAL, -- Cost of the AI operation in Earth currency
    json_api_metadata TEXT DEFAULT NULL, -- JSON field with additional API response data
    -- Extension data storage
    json_extensions TEXT DEFAULT NULL, -- JSON field for extensions to store arbitrary data
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Interstellar relational bindings
    CONSTRAINT fk_version_node FOREIGN KEY (node_id) REFERENCES nodes (id) ON DELETE CASCADE,
    CONSTRAINT fk_version_model FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE SET NULL
  );

-- Indexes for node_versions (for state evolution at warp speed)
CREATE INDEX idx_node_versions_node_id ON node_versions (node_id);

-- Find all versions for a node
-- 🚀 PROVIDERS TABLE (formerly ai_integrations)
CREATE TABLE
  providers (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - provider identifier
    name TEXT NOT NULL, -- Display name for the provider
    base_url TEXT NOT NULL, -- API base URL
    auth_type TEXT NOT NULL, -- 'none', 'bearer', 'custom'
    api_key_id TEXT, -- ULID - user identifier for API key
    json_auth_config TEXT, -- JSON: custom token placement, headers, etc.
    json_keys TEXT, -- JSON: keys for the provider
    json_variables TEXT, -- JSON: variables for the provider
    models_sync_strategy TEXT NOT NULL, -- 'mynth', 'local'
    marketplace_id TEXT, -- Identifier if from marketplace
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP -- For syncing/versioning
  );

-- 🛰️ PROVIDER ENDPOINTS TABLE
CREATE TABLE
  provider_endpoints (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - endpoint identifier
    provider_id TEXT NOT NULL, -- FK to providers
    display_name TEXT, -- e.g. 'chat'
    type TEXT NOT NULL, -- 'chat', 'completion', 'embedding', 'moderation'
    path TEXT NOT NULL, -- Relative URL
    method TEXT NOT NULL, -- 'GET', 'POST'
    compatibility TEXT NOT NULL DEFAULT 'none', -- `none` | `openai`
    request_template TEXT, -- Jinja template for request body
    -- Schema
    json_request_schema TEXT, -- JSON: template or schema for request body
    json_response_schema TEXT, -- JSON: template or schema for response body
    -- Response parsing and request building
    json_request_config TEXT, -- JSON: extra config (e.g. headers override)
    json_response_config TEXT, -- JSON: template or schema for response body
    json_variables TEXT, -- JSON: variables for the endpoint
    streaming BOOLEAN NOT NULL DEFAULT TRUE, -- Does it stream?
    priority INTEGER, -- Optional: helps choose default endpoint
    json_config TEXT, -- JSON: extra config (e.g. headers override)
    marketplace_id TEXT, -- Identifier if from marketplace
    CONSTRAINT fk_endpoint_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE
  );

-- 🤖 PROVIDER MODELS TABLE
CREATE TABLE
  models (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - model identifier
    name TEXT NOT NULL, -- model name used in API calls
    display_name TEXT, -- User-facing title
    provider_id TEXT, -- Reference to the provider this model belongs to
    max_input_tokens INTEGER, -- Maximum context window size (e.g. 8192, 32000)
    input_price REAL, -- Cost per 1k tokens for prompts
    output_price REAL, -- Cost per 1k tokens for completions
    tags TEXT, -- Comma-separated or JSON array of model tags
    capabilities TEXT, -- Comma-separated list of model capabilities (e.g., reasoning, format, image_processing, code_generation)
    source TEXT NOT NULL, -- 'remote', 'local'. If 'remote', provider info derived from connected endpoints.
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE, -- Whether to show in UI
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this model is pinned for quick access
    is_favourite BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this model is favourited by user (for special treatment in UI)
    request_template TEXT, -- Model-level default template (can be overridden in model_endpoint_configurations)
    json_config TEXT, -- JSON: architecture, family, speeds, etc. (can be overridden)
    marketplace_id TEXT, -- Identifier if from marketplace
    json_variables TEXT, -- JSON: variables for the model
    json_metadata_v1 TEXT, -- JSON: metadata for v1
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- For syncing
    -- Interstellar relational bindings
    CONSTRAINT fk_model_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE SET NULL
  );

-- Indexes for models (for galactic provider-model lookups at light speed)
CREATE INDEX idx_models_provider_id ON models (provider_id);

-- 🔗 MODEL-ENDPOINT CONFIGURATIONS
-- This table establishes a many-to-many relationship between models and provider_endpoints.
-- It ensures that a model can use a specific endpoint for a given capability type (e.g., 'chat', 'completion'),
-- and that a model can only be configured with one endpoint per type.
CREATE TABLE
  model_endpoint_configurations (
    id TEXT PRIMARY KEY NOT NULL, -- ULID for this configuration entry
    model_id TEXT NOT NULL, -- Foreign key to the models table
    endpoint_type TEXT NOT NULL, -- The type of capability, e.g., 'chat', 'completion', 'embedding'
    endpoint_id TEXT NOT NULL, -- Foreign key to the provider_endpoints table
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mec_model FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE,
    CONSTRAINT fk_mec_endpoint FOREIGN KEY (endpoint_id) REFERENCES provider_endpoints (id) ON DELETE CASCADE,
    -- Crucial constraint: A model can only have one endpoint configured for each endpoint_type.
    CONSTRAINT uq_model_endpoint_type UNIQUE (model_id, endpoint_type)
  );

-- Indexes for model_endpoint_configurations
CREATE INDEX idx_mec_model_id ON model_endpoint_configurations (model_id);

CREATE INDEX idx_mec_endpoint_id ON model_endpoint_configurations (endpoint_id);

-- This index supports the unique constraint and is useful for querying a model's configuration for a specific type.
CREATE INDEX idx_mec_model_id_endpoint_type ON model_endpoint_configurations (model_id, endpoint_type);

-- Find variables by key
-- CREATE INDEX idx_variables_key ON variables (key);
-- Find variables for a workspace
-- CREATE INDEX idx_variables_workspace_id ON variables (workspace_id);
-- Find variables for a folder
-- CREATE INDEX idx_variables_folder_id ON variables (folder_id);
-- Find variables for a chat
-- 🛠️ MCP SERVER INTEGRATION PLATFORM
-- Coordinate servers for the Multi-Cognitive Processing (MCP) network
CREATE TABLE
  mcp_servers (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - Server identification sequence
    name TEXT NOT NULL UNIQUE, -- Unique server name/handle
    display_name TEXT, -- User-facing title
    command TEXT NOT NULL, -- Execution command
    arguments TEXT, -- JSON array of arguments
    env TEXT, -- JSON object for environment variables
    settings TEXT, -- JSON object for server-specific settings
    type TEXT NOT NULL DEFAULT 'mcp', -- Type of server, e.g., 'mcp', 'api'
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Is this server currently active?
    is_enabled_globally BOOLEAN NOT NULL DEFAULT TRUE, -- Global default for this server
    is_custom BOOLEAN NOT NULL DEFAULT TRUE, -- Is this a custom server?
    description TEXT, -- Optional description
    credits TEXT, -- Credits or attribution
    url TEXT, -- URL for more information
    marketplace_id TEXT, -- Identifier if from marketplace
    metadata TEXT, -- JSON object for arbitrary metadata
    -- Temporal markers
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- No indexes for servers yet (aliens are still negotiating with the MCP)
-- 🔧 TOOL REGISTRY
-- Catalog of tools available from MCP servers or standalone
CREATE TABLE
  tools (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - Tool identification sequence
    display_name TEXT, -- User-facing title
    name TEXT NOT NULL, -- Tool name/handle
    description TEXT NOT NULL, -- Optional description
    json_parameters TEXT, -- JSON object for parameters
    type TEXT NOT NULL DEFAULT 'function', -- 'function', 'tool'
    mcp_server_id TEXT, -- Reference to the MCP server (optional - NULL for standalone tools)
    status TEXT NOT NULL DEFAULT 'enabled', -- 'enabled', 'disabled'
    allowance TEXT NOT NULL DEFAULT 'ask', -- 'ask', 'allow'
    is_enabled_globally BOOLEAN NOT NULL DEFAULT TRUE, -- Global default for this tool
    is_destructive BOOLEAN DEFAULT FALSE, -- Does the tool make irreversible changes?
    is_read_only BOOLEAN DEFAULT FALSE, -- Does the tool only read data?
    annotations TEXT, -- JSON object for additional metadata
    input_schema TEXT, -- JSON schema for tool input
    json_metadata TEXT, -- JSON object for arbitrary metadata
    -- Temporal markers
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Interstellar relational bindings
    CONSTRAINT fk_tool_server FOREIGN KEY (mcp_server_id) REFERENCES mcp_servers (id) ON DELETE CASCADE,
    -- Ensure tool name is unique within a server (or globally for standalone tools)
    CONSTRAINT uq_tool_server UNIQUE (mcp_server_id, name)
  );

-- No indexes for tools yet (galactic tool registry is still small)
-- 🌌 TOOL CALLS
-- Records tool invocations linked to specific node versions
CREATE TABLE
  tool_call (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - tool call identifier with embedded timestamp
    -- State data
    status TEXT NOT NULL, -- 'pending', 'cancelled', 'done'
    input TEXT, -- JSON storing input parameters for the tool
    -- Reference to node version
    node_version_id TEXT NOT NULL, -- The node version this tool call belongs to
    -- Reference to the specific tool used
    tool_id TEXT NOT NULL, -- The tool used in this operation
    -- Temporal markers
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Interstellar relational bindings
    CONSTRAINT fk_tool_call_version FOREIGN KEY (node_version_id) REFERENCES node_versions (id) ON DELETE CASCADE,
    CONSTRAINT fk_tool_call_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
  );

-- Indexes for tool_call (for tool call tracking at galactic scale)
CREATE INDEX idx_tool_call_node_version_id ON tool_call (node_version_id);

CREATE INDEX idx_tool_call_tool_id ON tool_call (tool_id);

-- 🛰️ TOOL RESULTS
-- Stores tool outputs linked to specific node versions
CREATE TABLE
  tool_result (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - tool result identifier
    output TEXT, -- Pretty printed output
    status TEXT, -- 'generating', 'error', 'done'
    -- Reference to node version
    node_version_id TEXT NOT NULL, -- The node version this tool result belongs to
    -- Reference to the specific tool used
    tool_id TEXT NOT NULL, -- The tool used in this operation
    -- Temporal markers
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Interstellar relational bindings
    CONSTRAINT fk_tool_result_version FOREIGN KEY (node_version_id) REFERENCES node_versions (id) ON DELETE CASCADE,
    CONSTRAINT fk_tool_result_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
  );

-- Indexes for tool_result (for tool result tracking at galactic scale)
CREATE INDEX idx_tool_result_node_version_id ON tool_result (node_version_id);

CREATE INDEX idx_tool_result_tool_id ON tool_result (tool_id);

-- 🎛️ ENTITY CONFIGURATION OVERRIDE MATRIX
-- This table stores explicit overrides for tool and server enablement at different entity levels
-- The absence of a row implies inheritance from parent or global defaults
CREATE TABLE
  tools_settings (
    id TEXT PRIMARY KEY NOT NULL, -- ULID - Setting override identifier with embedded timestamp
    -- Which kind of entity is this setting for?
    entity_type TEXT NOT NULL CHECK (entity_type IN ('workspace', 'folder', 'chat')), -- The type of entity being configured
    -- The ID of the workspace, folder, or chat
    entity_id TEXT NOT NULL, -- Reference to the specific entity
    -- Which kind of item is being configured?
    configurable_type TEXT NOT NULL CHECK (configurable_type IN ('mcp_server', 'tool')), -- What is being configured
    -- The ID of the mcp_server or tool
    configurable_id TEXT NOT NULL, -- Reference to the specific server or tool
    -- The override state: TRUE for ENABLED, FALSE for DISABLED
    is_enabled BOOLEAN NOT NULL, -- Override state for this entity-configurable combination
    -- Temporal markers for configuration tracking
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ensure we can't set the same thing twice for the same entity
    CONSTRAINT uq_entity_configurable UNIQUE (
      entity_type,
      entity_id,
      configurable_type,
      configurable_id
    )
  );

-- Indexes for tools_settings (for rapid configuration lookups across the galactic hierarchy)
CREATE INDEX idx_tools_settings_entity ON tools_settings (entity_type, entity_id);

-- Find all settings for a specific entity
CREATE INDEX idx_tools_settings_configurable ON tools_settings (configurable_type, configurable_id);

-- Find all entities using a specific configurable item