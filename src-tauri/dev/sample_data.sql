-- Insert AI Integration (Claude)
INSERT INTO ai_integrations (name, base_url, api_key)
VALUES ('Anthropic', 'https://api.anthropic.com/v1', 'dummy-key-1');

-- Insert AI Model
INSERT INTO ai_models (model_id, mynth_model_id, integration_id)
VALUES ('claude-3-sonnet', 'claude-3', 1);

-- Insert root folders
INSERT INTO chat_folders (id, name, parent_id)
VALUES 
    (1, 'Work Projects', NULL),
    (2, 'Personal', NULL),
    (3, 'Study', NULL);

-- Insert nested folders
INSERT INTO chat_folders (id, name, parent_id)
VALUES 
    (4, 'Project Alpha', 1),
    (5, 'Project Beta', 1),
    (6, 'Travel Plans', 2),
    (7, 'Recipe Ideas', 2),
    (8, 'Computer Science', 3),
    (9, 'Mathematics', 3);

-- Insert chats
INSERT INTO chats (id, name, folder_id)
VALUES 
    (1, 'API Design Discussion', 4),
    (2, 'Bug Fixes', 4),
    (3, 'Team Meeting Notes', 5),
    (4, 'Japan Trip 2024', 6),
    (5, 'Italian Recipes', 7),
    (6, 'Data Structures', 8),
    (7, 'Linear Algebra', 9);

-- Insert branches for each chat
INSERT INTO branches (id, name, chat_id)
VALUES 
    (1, 'main', 1),
    (2, 'alternative-approach', 1),
    (3, 'main', 2),
    (4, 'main', 3),
    (5, 'main', 4),
    (6, 'kyoto-plan', 4),
    (7, 'main', 5),
    (8, 'main', 6),
    (9, 'main', 7);

-- Insert some messages
INSERT INTO messages (content, role, branch_id, parent_id, model_id)
VALUES 
    -- API Design Discussion (main branch)
    ('Can you help me design a RESTful API for our new project?', 'user', 1, NULL, NULL),
    ('I''d be happy to help you design a RESTful API. What are the main resources and operations you need to support?', 'assistant', 1, 1, 1),
    ('We need to handle user authentication, product management, and order processing.', 'user', 1, 2, NULL),
    
    -- Bug Fixes chat
    ('I''m getting a null pointer exception in the login module. Here''s the stack trace...', 'user', 3, NULL, NULL),
    ('Based on the stack trace, it looks like the user session isn''t being initialized properly. Let''s check the authentication middleware.', 'assistant', 3, 4, 1),
    
    -- Japan Trip chat
    ('Can you help me plan a 2-week itinerary for Japan?', 'user', 5, NULL, NULL),
    ('I''d be happy to help! Japan is a fascinating country. Let''s start with your interests and must-see destinations.', 'assistant', 5, 6, 1),
    
    -- Data Structures chat
    ('Can you explain how a red-black tree works?', 'user', 8, NULL, NULL),
    ('A red-black tree is a type of self-balancing binary search tree. Here are its key properties...', 'assistant', 8, 8, 1);

-- Update current_branch_id for chats
UPDATE chats
SET current_branch_id = 
    CASE id
        WHEN 1 THEN 1
        WHEN 2 THEN 3
        WHEN 3 THEN 4
        WHEN 4 THEN 5
        WHEN 5 THEN 7
        WHEN 6 THEN 8
        WHEN 7 THEN 9
    END;

-- Update latest_message_id for branches
UPDATE branches
SET latest_message_id = 
    CASE id
        WHEN 1 THEN 3
        WHEN 3 THEN 5
        WHEN 5 THEN 7
        WHEN 8 THEN 9
    END; 