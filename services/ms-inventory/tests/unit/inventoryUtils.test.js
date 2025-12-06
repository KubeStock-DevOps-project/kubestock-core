/**
 * Unit Tests for Inventory Utility Functions
 * Tests helper functions and business logic
 */

describe('Inventory Utility Functions', () => {
  describe('Stock Calculations', () => {
    // Helper function to calculate available stock
    const calculateAvailableStock = (quantity, reservedQuantity = 0) => {
      return quantity - reservedQuantity;
    };

    test('should calculate available stock correctly', () => {
      expect(calculateAvailableStock(100, 20)).toBe(80);
    });

    test('should return full quantity when no reservations', () => {
      expect(calculateAvailableStock(100, 0)).toBe(100);
    });

    test('should handle zero stock', () => {
      expect(calculateAvailableStock(0, 0)).toBe(0);
    });

    test('should handle fully reserved stock', () => {
      expect(calculateAvailableStock(50, 50)).toBe(0);
    });
  });

  describe('Low Stock Detection', () => {
    // Helper function to check if stock is low
    const isLowStock = (quantity, reorderLevel) => {
      return quantity <= reorderLevel;
    };

    test('should detect low stock when quantity equals reorder level', () => {
      expect(isLowStock(10, 10)).toBe(true);
    });

    test('should detect low stock when quantity below reorder level', () => {
      expect(isLowStock(5, 10)).toBe(true);
    });

    test('should not flag as low stock when quantity above reorder level', () => {
      expect(isLowStock(100, 10)).toBe(false);
    });

    test('should handle zero reorder level', () => {
      expect(isLowStock(0, 0)).toBe(true);
      expect(isLowStock(1, 0)).toBe(false);
    });
  });

  describe('Quantity Change Calculation', () => {
    // Helper function to calculate quantity change based on movement type
    const calculateQuantityChange = (movementType, quantity) => {
      if (['out', 'damaged', 'expired'].includes(movementType)) {
        return -Math.abs(quantity);
      } else if (['in', 'returned'].includes(movementType)) {
        return Math.abs(quantity);
      }
      return quantity; // adjustment type
    };

    test('should return negative for "out" movement', () => {
      expect(calculateQuantityChange('out', 10)).toBe(-10);
    });

    test('should return negative for "damaged" movement', () => {
      expect(calculateQuantityChange('damaged', 5)).toBe(-5);
    });

    test('should return negative for "expired" movement', () => {
      expect(calculateQuantityChange('expired', 3)).toBe(-3);
    });

    test('should return positive for "in" movement', () => {
      expect(calculateQuantityChange('in', 20)).toBe(20);
    });

    test('should return positive for "returned" movement', () => {
      expect(calculateQuantityChange('returned', 15)).toBe(15);
    });
  });

  describe('Stock Availability Check', () => {
    // Helper function to check stock availability
    const checkStockAvailability = (currentStock, requiredQuantity) => {
      if (currentStock < requiredQuantity) {
        return {
          available: false,
          shortage: requiredQuantity - currentStock,
        };
      }
      return {
        available: true,
        shortage: 0,
      };
    };

    test('should return available when stock is sufficient', () => {
      const result = checkStockAvailability(100, 50);
      expect(result.available).toBe(true);
      expect(result.shortage).toBe(0);
    });

    test('should return unavailable when stock is insufficient', () => {
      const result = checkStockAvailability(30, 50);
      expect(result.available).toBe(false);
      expect(result.shortage).toBe(20);
    });

    test('should return available when stock exactly matches required', () => {
      const result = checkStockAvailability(50, 50);
      expect(result.available).toBe(true);
      expect(result.shortage).toBe(0);
    });

    test('should handle zero stock', () => {
      const result = checkStockAvailability(0, 10);
      expect(result.available).toBe(false);
      expect(result.shortage).toBe(10);
    });
  });
});
