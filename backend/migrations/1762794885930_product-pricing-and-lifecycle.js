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
  // Add lifecycle columns to products table
  pgm.addColumns("products", {
    lifecycle_state: { type: "varchar(50)", default: "draft" },
    created_by: { type: "integer" },
    approved_by: { type: "integer" },
    approved_at: { type: "timestamp" },
  });

  pgm.createIndex("products", "lifecycle_state");
  pgm.createIndex("products", "created_by");

  // Create pricing_rules table
  pgm.createTable("pricing_rules", {
    id: "id",
    rule_name: { type: "varchar(255)", notNull: true },
    rule_type: {
      type: "varchar(50)",
      notNull: true,
      comment: "bulk, promotion, category, customer_tier",
    },
    product_id: {
      type: "integer",
      references: "products",
      onDelete: "CASCADE",
    },
    category_id: {
      type: "integer",
      references: "categories",
      onDelete: "CASCADE",
    },
    min_quantity: { type: "integer", default: 1 },
    discount_percentage: { type: "decimal(5,2)", notNull: true },
    promo_name: { type: "varchar(255)" },
    valid_from: { type: "date" },
    valid_until: { type: "date" },
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

  pgm.createIndex("pricing_rules", "product_id");
  pgm.createIndex("pricing_rules", "category_id");
  pgm.createIndex("pricing_rules", "rule_type");
  pgm.createIndex("pricing_rules", ["valid_from", "valid_until"]);
  pgm.createIndex("pricing_rules", "is_active");

  // Create product_lifecycle_history table
  pgm.createTable("product_lifecycle_history", {
    id: "id",
    product_id: {
      type: "integer",
      notNull: true,
      references: "products",
      onDelete: "CASCADE",
    },
    old_state: { type: "varchar(50)" },
    new_state: { type: "varchar(50)", notNull: true },
    changed_by: { type: "integer", notNull: true },
    changed_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    notes: "text",
  });

  pgm.createIndex("product_lifecycle_history", "product_id");
  pgm.createIndex("product_lifecycle_history", "changed_at");

  // Add comments
  pgm.sql(`
    COMMENT ON TABLE pricing_rules IS 'Stores dynamic pricing rules for products and categories';
    COMMENT ON TABLE product_lifecycle_history IS 'Audit trail for product lifecycle state transitions';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("product_lifecycle_history", { ifExists: true, cascade: true });
  pgm.dropTable("pricing_rules", { ifExists: true, cascade: true });

  pgm.dropColumns("products", [
    "lifecycle_state",
    "created_by",
    "approved_by",
    "approved_at",
  ]);
};
