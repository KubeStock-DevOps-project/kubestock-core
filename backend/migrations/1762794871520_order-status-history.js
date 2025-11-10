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
  // Create order_status_history table
  pgm.createTable("order_status_history", {
    id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: "orders",
      onDelete: "CASCADE",
    },
    old_status: { type: "varchar(50)" },
    new_status: { type: "varchar(50)", notNull: true },
    changed_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    changed_by: { type: "integer", comment: "user_id who made the change" },
    notes: "text",
  });

  pgm.createIndex("order_status_history", "order_id");
  pgm.createIndex("order_status_history", "changed_at");

  pgm.sql(`
    COMMENT ON TABLE order_status_history IS 'Tracks all status changes for orders';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("order_status_history", { ifExists: true, cascade: true });
};
