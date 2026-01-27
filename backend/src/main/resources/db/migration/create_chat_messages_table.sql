-- Create chat_messages table for storing AI assistant conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'USER' or 'ASSISTANT'
    content TEXT NOT NULL,
    action_type VARCHAR(20), -- 'CHAT', 'TRANSACTION', 'CATEGORY', 'ACCOUNT', 'HELP'
    transaction_data TEXT, -- JSON 형태로 저장
    category_data TEXT,   -- JSON 형태로 저장
    account_data TEXT,    -- JSON 형태로 저장
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
