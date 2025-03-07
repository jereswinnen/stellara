-- Add preferences column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Update existing users to have an empty preferences object
UPDATE users SET preferences = '{}' WHERE preferences IS NULL; 