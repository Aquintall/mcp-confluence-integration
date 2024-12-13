-- Initialize database schema for Confluence integration

-- Ensure assistant_state table exists
CREATE TABLE IF NOT EXISTS assistant_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT,
    chat_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assistant_state_key 
    ON assistant_state(key);

-- Create unique constraint for key
CREATE UNIQUE INDEX IF NOT EXISTS idx_assistant_state_key_unique 
    ON assistant_state(key) 
    WHERE chat_id IS NULL;