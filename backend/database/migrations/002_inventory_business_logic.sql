-- Add reserved_quantity column to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;

-- Create stock_alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  sku VARCHAR(100) NOT NULL,
  current_quantity INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'overstock'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'ignored'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, alert_type)
);

-- Create reorder_suggestions table
CREATE TABLE IF NOT EXISTS reorder_suggestions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  sku VARCHAR(100) NOT NULL,
  current_quantity INTEGER NOT NULL,
  suggested_quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'ordered'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  processed_by INTEGER,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_status ON stock_alerts(status);
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_product ON reorder_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_status ON reorder_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_inventory_reserved ON inventory(reserved_quantity);

-- Add comment
COMMENT ON COLUMN inventory.reserved_quantity IS 'Quantity reserved for pending orders';
COMMENT ON TABLE stock_alerts IS 'Tracks low stock and other inventory alerts';
COMMENT ON TABLE reorder_suggestions IS 'Automatic reorder suggestions when stock is low';
