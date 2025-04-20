# Database Schema Documentation

## Overview

This document outlines the database schema design decisions for the Mynth App. The database is structured with a playful "alien observation" theme throughout the schema.

## Tables

### Core Tables

- `workspaces`: Top-level organizational units (aka "Workspace Habitation Units") that serve as the primary colonization sector where all data is processed
- `chat_folders`: Groups of chats within workspaces - these "Information Clustering Apparatus" organize communications into hierarchical formations
- `chats`: Individual conversation threads, the central data core of our observation mission, similar to telepathic gathering chambers
- `chat_branches`: Alternate timeline variants of conversations, functioning as a "Timeline Divergence Apparatus" for creating alternate reality simulations
- `chat_nodes`: Individual messages within conversations, the fundamental "Communication Quantum Particles" that can manifest as either user or assistant messages/notes
- `chat_node_messages`: Versioned content for messages, enabling tracking of communication evolution across time
- `ai_integrations`: AI provider configurations and protocols for connecting to various intelligence simulation hubs
- `ai_models`: Available AI models from integrations, the thought-pattern generators in our observation laboratory

## Enhancement Tables

### Model Settings

The `model_settings` table stores configuration parameters for AI models at different levels of the hierarchy. It serves as a configuration matrix for storing customized settings for different AI models across workspaces, folders, and chats.

Key characteristics:

- Uses JSONB for flexible parameter storage to support diverse AI model requirements
- Enforces entity integrity constraints to ensure settings exist at one level only
- Maintains unique model configurations per entity

### Variables

The `variables` table stores key-value pairs that can be used throughout the application. These "Variable Containment Vessels" allow for customizable data elements used in system prompts and chat messages.

Key characteristics:

- Provides unique variable names per entity
- Includes optional descriptions for clarity
- Validates entity integrity with appropriate constraints

### Design Decisions

#### Model Settings

- **JSON Storage**: Model settings are stored as JSONB to accommodate varying parameters across different AI models.
- **Hierarchical Inheritance**: Settings can be defined at workspace, folder, or chat level, with inheritance following this hierarchy.
- **Model-Specific Settings**: Each entity can have settings for specific models.
- **Default Settings**: When `model_id` is NULL, the settings serve as defaults for any model without specific settings.
- **Clean Separation**: Default settings exist independently from model-specific settings, ensuring they remain even if models are deleted.

#### Variables

- **Simple Key-Value Pairs**: Variables are stored as key-value pairs with optional descriptions.
- **Flexible Usage**: Variables can be used in system prompts, chat messages, and other contexts within the application.
- **No Schema Enforcement**: Variables are schema-less to support various use cases without rigid constraints.
- **Hierarchical Inheritance**: Variables follow the workspace → folder → chat hierarchy for flexible overrides.
- **Substitution Syntax**: Variables can be referenced using the `{{variable_name}}` syntax.
- **Dynamic Discovery**: The application can parse content to discover used variables and suggest defining them.

#### Resolution Logic

When determining which model settings to use:

1. Check for settings for the specific model at chat level
2. If not found, check for default settings (model_id IS NULL) at chat level
3. If not found, check for settings for specific model at folder level
4. If not found, check for default settings at folder level
5. Continue up to workspace level
6. If nothing found, use application defaults

Similar resolution logic applies to variables, with values at the chat level overriding those at folder and workspace levels.

## Database Optimization

The schema includes carefully designed indexes (playfully called "Hyperdrive Acceleration Matrices") to accelerate data retrieval operations:

- Indexes on foreign keys to speed up relationship traversal
- Indexes on frequently queried fields like `node_type` and `key`
- Specialized indexes for hierarchical data access patterns

## Constraints and Data Integrity

Several constraints ensure data integrity across the schema:

- Foreign key constraints to maintain referential integrity
- Unique constraints to prevent duplicate entries
- Check constraints to enforce business rules, like ensuring settings exist at only one hierarchy level
- Nullable and non-nullable fields appropriately defined

## Future Extensions

Future schema enhancements planned:

- System prompts table for storing prompt templates
- Support for versioning of system prompts
- Tags for organizing chats, folders, and prompts
- Enhanced archiving functionality for long-term data storage
