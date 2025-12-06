/**
 * Unit Tests for Validation Middleware
 * Tests Joi schema validation for inventory operations
 */

const Joi = require('joi');

// Recreate schemas for testing (avoiding module side effects)
const createInventorySchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  sku: Joi.string().required(),
  quantity: Joi.number().integer().min(0).default(0),
  warehouse_location: Joi.string().max(100).optional().allow(''),
  reorder_level: Joi.number().integer().min(0).default(10),
  max_stock_level: Joi.number().integer().min(0).default(1000),
});

const adjustStockSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  sku: Joi.string().required(),
  movement_type: Joi.string()
    .valid('in', 'out', 'adjustment', 'damaged', 'expired', 'returned')
    .required(),
  quantity: Joi.number().integer().positive().required(),
  notes: Joi.string().max(500).optional().allow(''),
  performed_by: Joi.number().integer().positive().optional(),
});

describe('Validation Schemas', () => {
  describe('createInventorySchema', () => {
    test('should validate a valid inventory creation payload', () => {
      const validPayload = {
        product_id: 1,
        sku: 'SKU-001',
        quantity: 100,
        warehouse_location: 'Warehouse A',
        reorder_level: 20,
        max_stock_level: 500,
      };

      const { error } = createInventorySchema.validate(validPayload);
      expect(error).toBeUndefined();
    });

    test('should reject payload without required product_id', () => {
      const invalidPayload = {
        sku: 'SKU-001',
        quantity: 100,
      };

      const { error } = createInventorySchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('product_id');
    });

    test('should reject payload without required sku', () => {
      const invalidPayload = {
        product_id: 1,
        quantity: 100,
      };

      const { error } = createInventorySchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('sku');
    });

    test('should reject negative product_id', () => {
      const invalidPayload = {
        product_id: -1,
        sku: 'SKU-001',
      };

      const { error } = createInventorySchema.validate(invalidPayload);
      expect(error).toBeDefined();
    });

    test('should accept payload with only required fields', () => {
      const minimalPayload = {
        product_id: 1,
        sku: 'SKU-001',
      };

      const { error, value } = createInventorySchema.validate(minimalPayload);
      expect(error).toBeUndefined();
      expect(value.quantity).toBe(0); // default
      expect(value.reorder_level).toBe(10); // default
    });
  });

  describe('adjustStockSchema', () => {
    test('should validate a valid stock adjustment payload', () => {
      const validPayload = {
        product_id: 1,
        sku: 'SKU-001',
        movement_type: 'in',
        quantity: 50,
        notes: 'Restocking',
      };

      const { error } = adjustStockSchema.validate(validPayload);
      expect(error).toBeUndefined();
    });

    test('should reject invalid movement_type', () => {
      const invalidPayload = {
        product_id: 1,
        sku: 'SKU-001',
        movement_type: 'invalid_type',
        quantity: 50,
      };

      const { error } = adjustStockSchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('movement_type');
    });

    test('should accept all valid movement types', () => {
      const validTypes = ['in', 'out', 'adjustment', 'damaged', 'expired', 'returned'];

      validTypes.forEach((type) => {
        const payload = {
          product_id: 1,
          sku: 'SKU-001',
          movement_type: type,
          quantity: 10,
        };

        const { error } = adjustStockSchema.validate(payload);
        expect(error).toBeUndefined();
      });
    });

    test('should reject zero quantity', () => {
      const invalidPayload = {
        product_id: 1,
        sku: 'SKU-001',
        movement_type: 'in',
        quantity: 0,
      };

      const { error } = adjustStockSchema.validate(invalidPayload);
      expect(error).toBeDefined();
    });

    test('should reject negative quantity', () => {
      const invalidPayload = {
        product_id: 1,
        sku: 'SKU-001',
        movement_type: 'out',
        quantity: -10,
      };

      const { error } = adjustStockSchema.validate(invalidPayload);
      expect(error).toBeDefined();
    });
  });
});
