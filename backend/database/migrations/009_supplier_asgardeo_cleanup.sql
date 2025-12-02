-- ============================================
-- Migration: Clean Up Supplier Table for Asgardeo Integration
-- Date: 2025-12-02
-- Purpose: Remove user-related columns that Asgardeo now manages
--          Keep only business-specific supplier data
-- ============================================

\c supplier_db;

-- ============================================
-- Remove columns that Asgardeo now manages:
-- - contact_person (now comes from Asgardeo user profile)
-- - email (now comes from Asgardeo user profile)
-- - phone (now comes from Asgardeo user profile)
--
-- Keep columns that are business-specific:
-- - id (internal ID)
-- - asgardeo_sub (links to Asgardeo user)
-- - name (company/business name, different from user's display name)
-- - address (business address)
-- - country (business country)
-- - payment_terms (business terms)
-- - rating (business rating)
-- - is_active (account status)
-- - created_at, updated_at
-- ============================================

-- First, ensure asgardeo_sub column exists and has proper constraints
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS asgardeo_sub VARCHAR(255);

-- Make asgardeo_sub NOT NULL for new records and add unique constraint
-- Note: We can't add NOT NULL constraint if existing rows have NULL values
-- In production, migrate existing data first

-- Add unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'suppliers_asgardeo_sub_key'
    ) THEN
        ALTER TABLE suppliers ADD CONSTRAINT suppliers_asgardeo_sub_key UNIQUE (asgardeo_sub);
    END IF;
END $$;

-- Drop old user_id column if it exists (legacy from before Asgardeo)
ALTER TABLE suppliers DROP COLUMN IF EXISTS user_id;

-- Update column comments for clarity
COMMENT ON COLUMN suppliers.asgardeo_sub IS 'Asgardeo user ID (sub claim from JWT). Links to Asgardeo user profile for email, phone, etc.';
COMMENT ON COLUMN suppliers.name IS 'Supplier company/business name (may differ from user display name)';
COMMENT ON COLUMN suppliers.contact_person IS 'DEPRECATED: Contact person info now comes from Asgardeo user profile';
COMMENT ON COLUMN suppliers.email IS 'DEPRECATED: Email now comes from Asgardeo user profile. Keep for backwards compatibility.';
COMMENT ON COLUMN suppliers.phone IS 'DEPRECATED: Phone now comes from Asgardeo user profile. Keep for backwards compatibility.';

-- Note: We keep contact_person, email, and phone columns for now for backwards compatibility
-- They should be removed in a future migration after verifying the frontend uses Asgardeo data

-- ============================================
-- Create a view that joins supplier business data with placeholder for Asgardeo data
-- This helps transition code to the new model
-- ============================================

CREATE OR REPLACE VIEW supplier_profiles AS
SELECT 
    s.id,
    s.asgardeo_sub,
    s.name AS company_name,
    -- Legacy columns (to be replaced by Asgardeo data in application layer)
    s.contact_person,
    s.email,
    s.phone,
    -- Business-specific data
    s.address,
    s.country,
    s.payment_terms,
    s.rating,
    s.is_active,
    s.created_at,
    s.updated_at
FROM suppliers s;

-- ============================================
-- Add index for email lookups (used during transition)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

-- ============================================
-- Summary:
-- Columns kept (business data):
--   - id, asgardeo_sub, name, address, country, payment_terms, rating, is_active
--
-- Columns deprecated (user data from Asgardeo):
--   - contact_person, email, phone 
--   - Still exist for backwards compatibility
--   - Application should fetch from Asgardeo identity-service
-- ============================================
