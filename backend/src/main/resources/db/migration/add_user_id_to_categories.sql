-- Add user_id column to categories table
ALTER TABLE categories ADD COLUMN user_id BIGINT;

-- Add foreign key constraint
ALTER TABLE categories ADD CONSTRAINT fk_categories_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for user_id
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Make user_id NOT NULL after data migration
-- Note: If there are existing categories, you may need to assign them to a user first
-- ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
