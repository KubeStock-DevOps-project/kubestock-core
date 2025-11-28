-- Migration: Product Catalog Advanced Business Logic
-- Description: Adds pricing rules, product lifecycle management, and related features

-- ============================================================================
-- 1. ADD LIFECYCLE COLUMNS TO PRODUCTS TABLE
-- ============================================================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS lifecycle_state VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS created_by INTEGER,
ADD COLUMN IF NOT EXISTS approved_by INTEGER,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_products_lifecycle_state ON products(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);

-- ============================================================================
-- 2. CREATE PRICING_RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'bulk', 'promotion', 'category', 'customer_tier'
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  min_quantity INTEGER DEFAULT 1,
  discount_percentage DECIMAL(5,2) NOT NULL,
  promo_name VARCHAR(255),
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_rules_product ON pricing_rules(product_id);
CREATE INDEX idx_pricing_rules_category ON pricing_rules(category_id);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(valid_from, valid_until);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);

COMMENT ON TABLE pricing_rules IS 'Stores dynamic pricing rules for products and categories';
COMMENT ON COLUMN pricing_rules.rule_type IS 'Types: bulk (quantity discount), promotion (time-based), category (category-wide), customer_tier (VIP/Gold/Silver)';

-- ============================================================================
-- 3. CREATE PRODUCT_LIFECYCLE_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_lifecycle_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_state VARCHAR(50),
  new_state VARCHAR(50) NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_lifecycle_history_product ON product_lifecycle_history(product_id);
CREATE INDEX idx_lifecycle_history_date ON product_lifecycle_history(changed_at);

COMMENT ON TABLE product_lifecycle_history IS 'Audit trail for product lifecycle state transitions';

-- ============================================================================
-- 4. CREATE PRODUCT_BUNDLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_bundles (
  id SERIAL PRIMARY KEY,
  bundle_name VARCHAR(255) NOT NULL,
  description TEXT,
  bundle_discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
  id SERIAL PRIMARY KEY,
  bundle_id INTEGER NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  UNIQUE(bundle_id, product_id)
);

CREATE INDEX idx_bundle_items_bundle ON product_bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_product ON product_bundle_items(product_id);

COMMENT ON TABLE product_bundles IS 'Product bundles with special pricing';
COMMENT ON TABLE product_bundle_items IS 'Products included in bundles';

-- ============================================================================
-- 5. ADD CATEGORY CODE FOR SKU GENERATION
-- ============================================================================

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Update existing categories with codes
UPDATE categories SET code = 'ELE' WHERE name ILIKE '%electronic%' AND code IS NULL;
UPDATE categories SET code = 'CLO' WHERE name ILIKE '%cloth%' AND code IS NULL;
UPDATE categories SET code = 'FOO' WHERE name ILIKE '%food%' AND code IS NULL;
UPDATE categories SET code = 'BEV' WHERE name ILIKE '%beverage%' AND code IS NULL;
UPDATE categories SET code = 'HOM' WHERE name ILIKE '%home%' AND code IS NULL;
UPDATE categories SET code = 'TOY' WHERE name ILIKE '%toy%' AND code IS NULL;
UPDATE categories SET code = 'BOO' WHERE name ILIKE '%book%' AND code IS NULL;
UPDATE categories SET code = 'SPO' WHERE name ILIKE '%sport%' AND code IS NULL;
UPDATE categories SET code = 'GEN' WHERE code IS NULL; -- Default

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_code ON categories(code);

-- ============================================================================
-- 6. INSERT SAMPLE PRICING RULES (FOR DEMONSTRATION)
-- ============================================================================

-- Bulk discount rules
INSERT INTO pricing_rules (rule_name, rule_type, product_id, min_quantity, discount_percentage, is_active)
SELECT 
  'Bulk Discount ' || min_qty || '+', 
  'bulk', 
  p.id, 
  min_qty, 
  disc,
  true
FROM products p
CROSS JOIN (VALUES (10, 5), (50, 10), (100, 15)) AS disc_rules(min_qty, disc)
WHERE p.is_active = true
LIMIT 30
ON CONFLICT DO NOTHING;

-- Category-wide promotion
INSERT INTO pricing_rules (rule_name, rule_type, category_id, discount_percentage, promo_name, valid_from, valid_until, is_active)
SELECT 
  'Category Sale - ' || c.name,
  'category',
  c.id,
  10.00,
  'Spring Sale',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true
FROM categories c
LIMIT 5
ON CONFLICT DO NOTHING;

-- Flash promotion
INSERT INTO pricing_rules (rule_name, rule_type, discount_percentage, promo_name, valid_from, valid_until, is_active)
VALUES 
  ('Flash Sale 20%', 'promotion', 20.00, 'Weekend Flash Sale', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', true),
  ('Black Friday', 'promotion', 30.00, 'Black Friday Special', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. CREATE PRODUCT_ANALYTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW product_analytics AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.unit_price,
  p.lifecycle_state,
  p.is_active,
  c.name as category_name,
  COUNT(DISTINCT pr.id) as pricing_rules_count,
  COUNT(DISTINCT plh.id) as lifecycle_events_count,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN pricing_rules pr ON pr.product_id = p.id AND pr.is_active = true
LEFT JOIN product_lifecycle_history plh ON plh.product_id = p.id
GROUP BY p.id, p.sku, p.name, p.unit_price, p.lifecycle_state, p.is_active, c.name, p.created_at, p.updated_at;

COMMENT ON VIEW product_analytics IS 'Analytics view for product management';

-- ============================================================================
-- 8. CREATE FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to automatically update pricing rule timestamps
CREATE OR REPLACE FUNCTION update_pricing_rule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_rules_update_timestamp
BEFORE UPDATE ON pricing_rules
FOR EACH ROW
EXECUTE FUNCTION update_pricing_rule_timestamp();

-- Function to automatically update bundle timestamps
CREATE OR REPLACE FUNCTION update_bundle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bundles_update_timestamp
BEFORE UPDATE ON product_bundles
FOR EACH ROW
EXECUTE FUNCTION update_bundle_timestamp();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify pricing rules
SELECT COUNT(*) as pricing_rules_count FROM pricing_rules;

-- Verify lifecycle history table
SELECT COUNT(*) as lifecycle_history_count FROM product_lifecycle_history;

-- Verify category codes
SELECT id, name, code FROM categories ORDER BY id;

-- Verify product analytics view
SELECT * FROM product_analytics LIMIT 5;

COMMIT;
