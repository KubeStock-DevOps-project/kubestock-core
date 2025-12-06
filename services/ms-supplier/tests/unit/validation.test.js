/**
 * Unit Tests for Validation Utilities
 * Tests helper functions and validation logic
 */

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    const isValidPhone = (phone) => {
      return Boolean(phone) && phone.length <= 20 && phone.length >= 5;
    };

    it('should validate correct phone numbers', () => {
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('+1-555-555-5555')).toBe(true);
      expect(isValidPhone('12345')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('1234')).toBe(false);
      expect(isValidPhone('123456789012345678901')).toBe(false);
    });
  });

  describe('Supplier Name Validation', () => {
    const isValidName = (name) => {
      return Boolean(name) && name.trim().length >= 2 && name.trim().length <= 255;
    };

    it('should validate correct supplier names', () => {
      expect(isValidName('AB')).toBe(true);
      expect(isValidName('Acme Corporation')).toBe(true);
      expect(isValidName('Test Supplier Inc.')).toBe(true);
    });

    it('should reject invalid supplier names', () => {
      expect(isValidName('')).toBe(false);
      expect(isValidName('A')).toBe(false);
      expect(isValidName(null)).toBe(false);
      expect(isValidName(undefined)).toBe(false);
    });
  });

  describe('Purchase Order Status Validation', () => {
    const validStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled', 'draft'];

    const isValidStatus = (status) => {
      return validStatuses.includes(status);
    };

    it('should validate correct PO statuses', () => {
      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('approved')).toBe(true);
      expect(isValidStatus('ordered')).toBe(true);
      expect(isValidStatus('received')).toBe(true);
      expect(isValidStatus('cancelled')).toBe(true);
      expect(isValidStatus('draft')).toBe(true);
    });

    it('should reject invalid PO statuses', () => {
      expect(isValidStatus('invalid')).toBe(false);
      expect(isValidStatus('')).toBe(false);
      expect(isValidStatus('PENDING')).toBe(false);
    });
  });

  describe('Amount Validation', () => {
    const isValidAmount = (amount) => {
      return typeof amount === 'number' && amount >= 0 && isFinite(amount);
    };

    it('should validate correct amounts', () => {
      expect(isValidAmount(0)).toBe(true);
      expect(isValidAmount(100.50)).toBe(true);
      expect(isValidAmount(999999.99)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount(-1)).toBe(false);
      expect(isValidAmount('100')).toBe(false);
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
    });
  });

  describe('Date Validation', () => {
    const isValidDate = (dateString) => {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date);
    };

    it('should validate correct date formats', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31T23:59:59Z')).toBe(true);
      expect(isValidDate(new Date().toISOString())).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });
});
