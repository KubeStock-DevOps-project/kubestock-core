/* eslint-disable camelcase */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // ==================== USER SERVICE DATABASE ====================

  // Users table
  pgm.createTable("users", {
    id: "id",
    username: { type: "varchar(50)", notNull: true, unique: true },
    email: { type: "varchar(100)", notNull: true, unique: true },
    password_hash: { type: "varchar(255)", notNull: true },
    full_name: { type: "varchar(100)" },
    role: {
      type: "varchar(20)",
      notNull: true,
      check: "role IN ('admin', 'warehouse_staff', 'supplier')",
    },
    is_active: { type: "boolean", default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("users", "email");
  pgm.createIndex("users", "username");
  pgm.createIndex("users", "role");

  // Insert default admin user
  pgm.sql(`
    INSERT INTO users (username, email, password_hash, full_name, role) 
    VALUES ('admin', 'admin@ims.com', '$2b$10$rKvVLZ8D3yP7YxK5sQ8Q9eLZJ4Zz5xZXzXzXzXzXzXzXzXzXzXzXz', 'System Administrator', 'admin')
    ON CONFLICT DO NOTHING;
  `);

  // ==================== PRODUCT CATALOG DATABASE ====================

  // Categories table
  pgm.createTable("categories", {
    id: "id",
    code: { type: "varchar(10)", unique: true },
    name: { type: "varchar(100)", notNull: true, unique: true },
    description: "text",
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Products table
  pgm.createTable("products", {
    id: "id",
    sku: { type: "varchar(50)", notNull: true, unique: true },
    name: { type: "varchar(200)", notNull: true },
    description: "text",
    category_id: {
      type: "integer",
      references: "categories",
      onDelete: "SET NULL",
    },
    size: { type: "varchar(20)" },
    color: { type: "varchar(50)" },
    unit_price: { type: "decimal(10,2)", notNull: true },
    attributes: { type: "jsonb" },
    is_active: { type: "boolean", default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("products", "sku");
  pgm.createIndex("products", "category_id");
  pgm.createIndex("products", "name");

  // Insert sample categories
  pgm.sql(`
    INSERT INTO categories (name, description, code) VALUES
      ('Electronics', 'Electronic devices and accessories', 'ELE'),
      ('Clothing', 'Apparel and fashion items', 'CLO'),
      ('Food & Beverages', 'Food items and drinks', 'FOO'),
      ('Office Supplies', 'Office equipment and supplies', 'GEN')
    ON CONFLICT DO NOTHING;
  `);

  // ==================== INVENTORY DATABASE ====================

  // Inventory table
  pgm.createTable("inventory", {
    id: "id",
    product_id: { type: "integer", notNull: true },
    sku: { type: "varchar(50)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 0 },
    reserved_quantity: { type: "integer", notNull: true, default: 0 },
    warehouse_location: { type: "varchar(100)" },
    reorder_level: { type: "integer", default: 10 },
    max_stock_level: { type: "integer", default: 1000 },
    last_restocked_at: { type: "timestamp" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Add generated column for available quantity
  pgm.sql(
    "ALTER TABLE inventory ADD COLUMN available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED;"
  );

  pgm.addConstraint("inventory", "unique_product_inventory", {
    unique: "product_id",
  });

  // Stock movements table
  pgm.createTable("stock_movements", {
    id: "id",
    product_id: { type: "integer", notNull: true },
    sku: { type: "varchar(50)", notNull: true },
    movement_type: {
      type: "varchar(20)",
      notNull: true,
      check:
        "movement_type IN ('in', 'out', 'adjustment', 'damaged', 'expired', 'returned')",
    },
    quantity: { type: "integer", notNull: true },
    reference_type: { type: "varchar(50)" },
    reference_id: { type: "integer" },
    notes: "text",
    performed_by: { type: "integer" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("inventory", "product_id");
  pgm.createIndex("inventory", "sku");
  pgm.createIndex("inventory", "reserved_quantity");
  pgm.createIndex("stock_movements", "product_id");
  pgm.createIndex("stock_movements", "movement_type");
  pgm.createIndex("stock_movements", "created_at");

  // ==================== SUPPLIER DATABASE ====================

  // Suppliers table
  pgm.createTable("suppliers", {
    id: "id",
    name: { type: "varchar(200)", notNull: true },
    contact_person: { type: "varchar(100)" },
    email: { type: "varchar(100)" },
    phone: { type: "varchar(20)" },
    address: "text",
    country: { type: "varchar(50)" },
    payment_terms: { type: "varchar(100)" },
    rating: {
      type: "decimal(3,2)",
      check: "rating >= 0 AND rating <= 5",
    },
    is_active: { type: "boolean", default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Purchase orders table
  pgm.createTable("purchase_orders", {
    id: "id",
    po_number: { type: "varchar(50)", notNull: true, unique: true },
    supplier_id: {
      type: "integer",
      references: "suppliers",
      onDelete: "SET NULL",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      check:
        "status IN ('draft', 'submitted', 'approved', 'received', 'cancelled')",
    },
    order_date: { type: "date", notNull: true },
    expected_delivery_date: { type: "date" },
    actual_delivery_date: { type: "date" },
    total_amount: { type: "decimal(12,2)" },
    notes: "text",
    created_by: { type: "integer" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Purchase order items table
  pgm.createTable("purchase_order_items", {
    id: "id",
    po_id: {
      type: "integer",
      references: "purchase_orders",
      onDelete: "CASCADE",
      notNull: true,
    },
    product_id: { type: "integer", notNull: true },
    sku: { type: "varchar(50)", notNull: true },
    quantity: { type: "integer", notNull: true },
    unit_price: { type: "decimal(10,2)", notNull: true },
    received_quantity: { type: "integer", default: 0 },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Add generated column for total price
  pgm.sql(
    "ALTER TABLE purchase_order_items ADD COLUMN total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;"
  );

  pgm.createIndex("suppliers", "name");
  pgm.createIndex("purchase_orders", "supplier_id");
  pgm.createIndex("purchase_orders", "status");
  pgm.createIndex("purchase_orders", "po_number");
  pgm.createIndex("purchase_order_items", "po_id");

  // ==================== ORDER DATABASE ====================

  // Orders table
  pgm.createTable("orders", {
    id: "id",
    order_number: { type: "varchar(50)", notNull: true, unique: true },
    customer_id: { type: "integer", notNull: true },
    status: {
      type: "varchar(20)",
      notNull: true,
      check:
        "status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')",
    },
    order_date: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    total_amount: { type: "decimal(12,2)" },
    shipping_address: "text",
    payment_method: { type: "varchar(50)" },
    payment_status: {
      type: "varchar(20)",
      check: "payment_status IN ('pending', 'paid', 'failed', 'refunded')",
    },
    notes: "text",
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Order items table
  pgm.createTable("order_items", {
    id: "id",
    order_id: {
      type: "integer",
      references: "orders",
      onDelete: "CASCADE",
      notNull: true,
    },
    product_id: { type: "integer", notNull: true },
    sku: { type: "varchar(50)", notNull: true },
    product_name: { type: "varchar(200)", notNull: true },
    quantity: { type: "integer", notNull: true },
    unit_price: { type: "decimal(10,2)", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Add generated column for total price
  pgm.sql(
    "ALTER TABLE order_items ADD COLUMN total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;"
  );

  pgm.createIndex("orders", "customer_id");
  pgm.createIndex("orders", "status");
  pgm.createIndex("orders", "order_number");
  pgm.createIndex("orders", "order_date");
  pgm.createIndex("order_items", "order_id");
  pgm.createIndex("order_items", "product_id");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop all tables in reverse order

  // Order database
  pgm.dropTable("order_items", { ifExists: true, cascade: true });
  pgm.dropTable("orders", { ifExists: true, cascade: true });

  // Supplier database
  pgm.dropTable("purchase_order_items", { ifExists: true, cascade: true });
  pgm.dropTable("purchase_orders", { ifExists: true, cascade: true });
  pgm.dropTable("suppliers", { ifExists: true, cascade: true });

  // Inventory database
  pgm.dropTable("stock_movements", { ifExists: true, cascade: true });
  pgm.dropTable("inventory", { ifExists: true, cascade: true });

  // Product catalog database
  pgm.dropTable("products", { ifExists: true, cascade: true });
  pgm.dropTable("categories", { ifExists: true, cascade: true });

  // User database
  pgm.dropTable("users", { ifExists: true, cascade: true });
};
