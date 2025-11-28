-- Migration: Add user_id to suppliers table and link existing records
-- Date: 2025-11-19
-- Purpose: Link suppliers to user accounts for proper authentication

-- Add user_id column if it doesn't exist
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);

-- Add foreign key constraint (optional - uncomment if needed)
-- ALTER TABLE suppliers 
-- ADD CONSTRAINT fk_suppliers_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update existing records (adjust IDs as needed)
-- UPDATE suppliers SET user_id = 4 WHERE id = 1;
-- UPDATE suppliers SET user_id = 7 WHERE id = 2;

-- For new suppliers, ensure user_id is set when creating
-- Example:
-- INSERT INTO suppliers (name, contact_person, email, phone, user_id) 
-- VALUES ('New Supplier', 'Contact Name', 'email@example.com', '123456789', <user_id>);
