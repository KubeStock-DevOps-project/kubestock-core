-- Seed Test Data for All Microservices
-- Run this after initial schema setup

-- ============================================================================
-- USER SERVICE DATA (user_service_db)
-- ============================================================================
\c user_service_db;

-- Insert users with different roles
-- Password for all users: password123
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@ims.com', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'admin', true),
('john_staff', 'john@ims.com', '$2b$10$YourHashedPasswordHere', 'John Warehouse', 'warehouse_staff', true),
('sarah_staff', 'sarah@ims.com', '$2b$10$YourHashedPasswordHere', 'Sarah Manager', 'warehouse_staff', true),
('mike_supplier', 'mike@techsupply.com', '$2b$10$YourHashedPasswordHere', 'Mike Tech Supply', 'supplier', true),
('lisa_supplier', 'lisa@globalparts.com', '$2b$10$YourHashedPasswordHere', 'Lisa Global Parts', 'supplier', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- PRODUCT CATALOG DATA (product_catalog_db)
-- ============================================================================
\c product_catalog_db;

-- Insert sample products
INSERT INTO products (sku, name, description, category_id, unit_price, is_active) VALUES
('ELEC-LAP-001', 'Dell Latitude Laptop', '14" Business Laptop, Intel i5, 8GB RAM', 1, 899.99, true),
('ELEC-MON-001', 'Samsung 27" Monitor', '4K UHD Monitor, 60Hz', 1, 349.99, true),
('ELEC-KEY-001', 'Logitech Wireless Keyboard', 'Bluetooth keyboard with numpad', 1, 79.99, true),
('ELEC-MOU-001', 'Logitech MX Master Mouse', 'Wireless ergonomic mouse', 1, 99.99, true),
('CLTH-SHT-001', 'Business Shirt - Blue', 'Professional cotton shirt, Size M', 2, 45.99, true),
('CLTH-PNT-001', 'Formal Pants - Black', 'Business pants, Size 32', 2, 65.99, true),
('CLTH-TIE-001', 'Silk Tie - Navy', 'Premium silk tie', 2, 29.99, true),
('FOOD-SNK-001', 'Granola Bars Box', 'Box of 24 healthy snack bars', 3, 12.99, true),
('FOOD-COF-001', 'Premium Coffee Beans 1kg', 'Arabica coffee beans', 3, 24.99, true),
('FOOD-TEA-001', 'Green Tea Box', 'Box of 100 tea bags', 3, 8.99, true),
('OFFC-PEN-001', 'Ballpoint Pens Pack', 'Pack of 50 blue pens', 4, 15.99, true),
('OFFC-NTB-001', 'A4 Notebooks Pack', 'Pack of 5 ruled notebooks', 4, 19.99, true),
('OFFC-PPR-001', 'Printer Paper Ream', 'A4 white paper, 500 sheets', 4, 7.99, true)
ON CONFLICT (sku) DO NOTHING;

-- ============================================================================
-- INVENTORY DATA (inventory_db)
-- ============================================================================
\c inventory_db;

-- Insert inventory records
INSERT INTO inventory (product_id, sku, quantity, reserved_quantity, warehouse_location, reorder_level, max_stock_level, last_restocked_at) VALUES
(1, 'ELEC-LAP-001', 45, 5, 'A-01-05', 10, 100, NOW() - INTERVAL '5 days'),
(2, 'ELEC-MON-001', 78, 8, 'A-01-06', 15, 150, NOW() - INTERVAL '3 days'),
(3, 'ELEC-KEY-001', 120, 10, 'A-02-01', 20, 200, NOW() - INTERVAL '7 days'),
(4, 'ELEC-MOU-001', 95, 5, 'A-02-02', 15, 150, NOW() - INTERVAL '4 days'),
(5, 'CLTH-SHT-001', 150, 15, 'B-01-03', 30, 300, NOW() - INTERVAL '10 days'),
(6, 'CLTH-PNT-001', 130, 12, 'B-01-04', 25, 250, NOW() - INTERVAL '8 days'),
(7, 'CLTH-TIE-001', 200, 20, 'B-01-05', 40, 400, NOW() - INTERVAL '12 days'),
(8, 'FOOD-SNK-001', 300, 25, 'C-01-01', 50, 500, NOW() - INTERVAL '2 days'),
(9, 'FOOD-COF-001', 180, 15, 'C-01-02', 30, 300, NOW() - INTERVAL '6 days'),
(10, 'FOOD-TEA-001', 250, 20, 'C-01-03', 40, 400, NOW() - INTERVAL '5 days'),
(11, 'OFFC-PEN-001', 400, 30, 'D-01-01', 60, 600, NOW() - INTERVAL '15 days'),
(12, 'OFFC-NTB-001', 280, 25, 'D-01-02', 45, 450, NOW() - INTERVAL '9 days'),
(13, 'OFFC-PPR-001', 500, 40, 'D-01-03', 80, 800, NOW() - INTERVAL '3 days')
ON CONFLICT (product_id) DO NOTHING;

-- Insert stock movements
INSERT INTO stock_movements (product_id, sku, movement_type, quantity, reference_type, notes, performed_by, created_at) VALUES
-- Recent restocking
(1, 'ELEC-LAP-001', 'in', 50, 'purchase_order', 'Restocked from supplier', 2, NOW() - INTERVAL '5 days'),
(2, 'ELEC-MON-001', 'in', 80, 'purchase_order', 'New shipment arrived', 2, NOW() - INTERVAL '3 days'),
(8, 'FOOD-SNK-001', 'in', 300, 'purchase_order', 'Bulk order delivery', 3, NOW() - INTERVAL '2 days'),
-- Recent sales
(1, 'ELEC-LAP-001', 'out', 5, 'order', 'Customer order #1001', 2, NOW() - INTERVAL '2 days'),
(2, 'ELEC-MON-001', 'out', 2, 'order', 'Customer order #1002', 3, NOW() - INTERVAL '1 day'),
(3, 'ELEC-KEY-001', 'out', 10, 'order', 'Bulk corporate order', 2, NOW() - INTERVAL '4 hours'),
(4, 'ELEC-MOU-001', 'out', 5, 'order', 'Office supplies order', 3, NOW() - INTERVAL '6 hours'),
-- Adjustments and issues
(5, 'CLTH-SHT-001', 'damaged', 5, 'inventory_check', 'Damaged during handling', 2, NOW() - INTERVAL '7 days'),
(9, 'FOOD-COF-001', 'adjustment', -3, 'inventory_check', 'Inventory count correction', 3, NOW() - INTERVAL '5 days'),
(12, 'OFFC-NTB-001', 'out', 15, 'order', 'School supply order', 2, NOW() - INTERVAL '3 hours');

-- ============================================================================
-- SUPPLIER DATA (supplier_db)
-- ============================================================================
\c supplier_db;

-- Insert suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, country, payment_terms, rating, is_active) VALUES
('Tech Supply Co.', 'Mike Johnson', 'mike@techsupply.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA 94025', 'USA', 'Net 30', 4.5, true),
('Global Parts Ltd.', 'Lisa Chen', 'lisa@globalparts.com', '+1-555-0102', '456 Industrial Ave, Austin, TX 78701', 'USA', 'Net 45', 4.8, true),
('Fashion Wholesale Inc.', 'David Brown', 'david@fashionwholesale.com', '+1-555-0103', '789 Fashion Blvd, New York, NY 10001', 'USA', 'Net 30', 4.2, true),
('Food Distributors Group', 'Emma Wilson', 'emma@fooddist.com', '+1-555-0104', '321 Market Street, Chicago, IL 60601', 'USA', 'Net 15', 4.7, true),
('Office Essentials Direct', 'James Taylor', 'james@officeessentials.com', '+1-555-0105', '654 Business Park, Seattle, WA 98101', 'USA', 'Net 30', 4.6, true)
ON CONFLICT DO NOTHING;

-- Insert purchase orders
INSERT INTO purchase_orders (po_number, supplier_id, status, order_date, expected_delivery_date, total_amount, notes, created_by) VALUES
('PO-2025-001', 1, 'received', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', 45000.00, 'Electronics restock order', 1),
('PO-2025-002', 2, 'received', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '3 days', 28000.00, 'Monitor shipment', 1),
('PO-2025-003', 3, 'approved', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 15000.00, 'Clothing items for new season', 1),
('PO-2025-004', 4, 'received', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day', 7500.00, 'Food and beverage supplies', 1),
('PO-2025-005', 5, 'submitted', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '7 days', 12000.00, 'Office supplies bulk order', 1),
('PO-2025-006', 1, 'draft', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 35000.00, 'Upcoming electronics order', 1)
ON CONFLICT (po_number) DO NOTHING;

-- Insert purchase order items
INSERT INTO purchase_order_items (po_id, product_id, sku, quantity, unit_price, received_quantity) VALUES
-- PO-2025-001 (Laptops)
(1, 1, 'ELEC-LAP-001', 50, 899.99, 50),
-- PO-2025-002 (Monitors)
(2, 2, 'ELEC-MON-001', 80, 349.99, 80),
-- PO-2025-003 (Clothing)
(3, 5, 'CLTH-SHT-001', 150, 45.99, 0),
(3, 6, 'CLTH-PNT-001', 100, 65.99, 0),
(3, 7, 'CLTH-TIE-001', 80, 29.99, 0),
-- PO-2025-004 (Food)
(4, 8, 'FOOD-SNK-001', 300, 12.99, 300),
(4, 9, 'FOOD-COF-001', 150, 24.99, 150),
-- PO-2025-005 (Office Supplies)
(5, 11, 'OFFC-PEN-001', 500, 15.99, 0),
(5, 12, 'OFFC-NTB-001', 300, 19.99, 0),
(5, 13, 'OFFC-PPR-001', 400, 7.99, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ORDER DATA (order_db)
-- ============================================================================
\c order_db;

-- Insert customer orders
INSERT INTO orders (order_number, customer_id, status, order_date, total_amount, shipping_address, payment_method, payment_status, notes) VALUES
('ORD-2025-1001', 101, 'delivered', NOW() - INTERVAL '10 days', 4499.95, '100 Customer Ave, Los Angeles, CA 90001', 'Credit Card', 'paid', 'Corporate bulk order'),
('ORD-2025-1002', 102, 'delivered', NOW() - INTERVAL '7 days', 699.98, '200 Client Street, San Francisco, CA 94102', 'PayPal', 'paid', 'Individual purchase'),
('ORD-2025-1003', 103, 'shipped', NOW() - INTERVAL '3 days', 1579.85, '300 Business Blvd, Denver, CO 80202', 'Credit Card', 'paid', 'Office setup order'),
('ORD-2025-1004', 104, 'processing', NOW() - INTERVAL '2 days', 459.94, '400 Home Lane, Boston, MA 02101', 'Debit Card', 'paid', 'Regular order'),
('ORD-2025-1005', 105, 'confirmed', NOW() - INTERVAL '1 day', 2899.90, '500 Corporate Center, Houston, TX 77001', 'Wire Transfer', 'pending', 'Bulk clothing order'),
('ORD-2025-1006', 106, 'pending', NOW() - INTERVAL '6 hours', 549.92, '600 Market Place, Miami, FL 33101', 'Credit Card', 'pending', 'Food supplies order')
ON CONFLICT (order_number) DO NOTHING;

-- Insert order items
INSERT INTO order_items (order_id, product_id, sku, product_name, quantity, unit_price) VALUES
-- ORD-2025-1001 (5 Laptops)
(1, 1, 'ELEC-LAP-001', 'Dell Latitude Laptop', 5, 899.99),
-- ORD-2025-1002 (2 Monitors)
(2, 2, 'ELEC-MON-001', 'Samsung 27" Monitor', 2, 349.99),
-- ORD-2025-1003 (Office setup)
(3, 1, 'ELEC-LAP-001', 'Dell Latitude Laptop', 1, 899.99),
(3, 2, 'ELEC-MON-001', 'Samsung 27" Monitor', 1, 349.99),
(3, 3, 'ELEC-KEY-001', 'Logitech Wireless Keyboard', 2, 79.99),
(3, 4, 'ELEC-MOU-001', 'Logitech MX Master Mouse', 2, 99.99),
-- ORD-2025-1004 (Accessories)
(4, 3, 'ELEC-KEY-001', 'Logitech Wireless Keyboard', 3, 79.99),
(4, 4, 'ELEC-MOU-001', 'Logitech MX Master Mouse', 2, 99.99),
-- ORD-2025-1005 (Clothing bulk)
(5, 5, 'CLTH-SHT-001', 'Business Shirt - Blue', 30, 45.99),
(5, 6, 'CLTH-PNT-001', 'Formal Pants - Black', 20, 65.99),
-- ORD-2025-1006 (Food supplies)
(6, 8, 'FOOD-SNK-001', 'Granola Bars Box', 20, 12.99),
(6, 9, 'FOOD-COF-001', 'Premium Coffee Beans 1kg', 10, 24.99)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\c user_service_db;
SELECT 'Users:' as table_name, COUNT(*) as count FROM users;

\c product_catalog_db;
SELECT 'Categories:' as table_name, COUNT(*) as count FROM categories;
SELECT 'Products:' as table_name, COUNT(*) as count FROM products;

\c inventory_db;
SELECT 'Inventory:' as table_name, COUNT(*) as count FROM inventory;
SELECT 'Stock Movements:' as table_name, COUNT(*) as count FROM stock_movements;

\c supplier_db;
SELECT 'Suppliers:' as table_name, COUNT(*) as count FROM suppliers;
SELECT 'Purchase Orders:' as table_name, COUNT(*) as count FROM purchase_orders;
SELECT 'PO Items:' as table_name, COUNT(*) as count FROM purchase_order_items;

\c order_db;
SELECT 'Orders:' as table_name, COUNT(*) as count FROM orders;
SELECT 'Order Items:' as table_name, COUNT(*) as count FROM order_items;
