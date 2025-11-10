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
  // Stock alerts table
  pgm.createTable("stock_alerts", {
    id: "id",
    product_id: { type: "integer", notNull: true },
    sku: { type: "varchar(100)", notNull: true },
    current_quantity: { type: "integer", notNull: true },
    reorder_level: { type: "integer", notNull: true },
    alert_type: {
      type: "varchar(50)",
      notNull: true,
      comment: "low_stock, out_of_stock, overstock",
    },
    status: {
      type: "varchar(50)",
      default: "active",
      comment: "active, resolved, ignored",
    },
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

  pgm.addConstraint("stock_alerts", "unique_product_alert", {
    unique: ["product_id", "alert_type"],
  });

  // Reorder suggestions table
  pgm.createTable("reorder_suggestions", {
    id: "id",
    product_id: { type: "integer", notNull: true },
    sku: { type: "varchar(100)", notNull: true },
    current_quantity: { type: "integer", notNull: true },
    suggested_quantity: { type: "integer", notNull: true },
    status: {
      type: "varchar(50)",
      default: "pending",
      comment: "pending, approved, rejected, ordered",
    },
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
    processed_at: { type: "timestamp" },
    processed_by: { type: "integer" },
    notes: "text",
  });

  // Create indexes
  pgm.createIndex("stock_alerts", "product_id");
  pgm.createIndex("stock_alerts", "status");
  pgm.createIndex("reorder_suggestions", "product_id");
  pgm.createIndex("reorder_suggestions", "status");

  // Add comments
  pgm.sql(`
    COMMENT ON TABLE stock_alerts IS 'Tracks low stock and other inventory alerts';
    COMMENT ON TABLE reorder_suggestions IS 'Automatic reorder suggestions when stock is low';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("reorder_suggestions", { ifExists: true, cascade: true });
  pgm.dropTable("stock_alerts", { ifExists: true, cascade: true });
};
