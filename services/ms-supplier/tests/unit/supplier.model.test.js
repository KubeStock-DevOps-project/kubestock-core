/**
 * Unit Tests for Supplier Model
 * Tests the Supplier model methods with mocked database
 */

const Supplier = require('../../src/models/supplier.model');

// Mock the database module
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Mock the logger module
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const db = require('../../src/config/database');
const logger = require('../../src/config/logger');

describe('Supplier Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new supplier successfully', async () => {
      const supplierData = {
        name: 'Test Supplier',
        contact_person: 'John Doe',
        email: 'john@test.com',
        phone: '123-456-7890',
        address: '123 Test St',
        country: 'USA',
        payment_terms: 'Net 30',
        rating: 4.5,
        is_active: true
      };

      const expectedSupplier = {
        id: 1,
        ...supplierData,
        created_at: new Date(),
        updated_at: new Date()
      };

      db.query.mockResolvedValueOnce({ rows: [expectedSupplier] });

      const result = await Supplier.create(supplierData);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedSupplier);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw error when database fails', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'test@test.com'
      };

      const dbError = new Error('Database connection failed');
      db.query.mockRejectedValueOnce(dbError);

      await expect(Supplier.create(supplierData)).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      const suppliers = [
        { id: 1, name: 'Supplier 1', email: 'supplier1@test.com' },
        { id: 2, name: 'Supplier 2', email: 'supplier2@test.com' }
      ];

      db.query.mockResolvedValueOnce({ rows: suppliers });

      const result = await Supplier.findAll();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(suppliers);
    });

    it('should filter suppliers by is_active status', async () => {
      const activeSuppliers = [
        { id: 1, name: 'Active Supplier', is_active: true }
      ];

      db.query.mockResolvedValueOnce({ rows: activeSuppliers });

      const result = await Supplier.findAll({ is_active: true });

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(activeSuppliers);
    });

    it('should filter suppliers by search term', async () => {
      const searchResults = [
        { id: 1, name: 'Acme Corp', email: 'acme@test.com' }
      ];

      db.query.mockResolvedValueOnce({ rows: searchResults });

      const result = await Supplier.findAll({ search: 'Acme' });

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(searchResults);
    });
  });

  describe('findById', () => {
    it('should return supplier when found', async () => {
      const supplier = { id: 1, name: 'Test Supplier', email: 'test@test.com' };

      db.query.mockResolvedValueOnce({ rows: [supplier] });

      const result = await Supplier.findById(1);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM suppliers WHERE id = $1', [1]);
      expect(result).toEqual(supplier);
    });

    it('should return undefined when supplier not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Supplier.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should return supplier when email matches', async () => {
      const supplier = { id: 1, name: 'Test Supplier', email: 'test@test.com' };

      db.query.mockResolvedValueOnce({ rows: [supplier] });

      const result = await Supplier.findByEmail('test@test.com');

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM suppliers WHERE email = $1', ['test@test.com']);
      expect(result).toEqual(supplier);
    });
  });

  describe('update', () => {
    it('should update supplier successfully', async () => {
      const updatedSupplier = { id: 1, name: 'Updated Supplier', email: 'updated@test.com' };

      db.query.mockResolvedValueOnce({ rows: [updatedSupplier] });

      const result = await Supplier.update(1, { name: 'Updated Supplier' });

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedSupplier);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return null when supplier not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Supplier.update(999, { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('should throw error when no valid fields provided', async () => {
      await expect(Supplier.update(1, { invalidField: 'value' })).rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    it('should delete supplier successfully', async () => {
      const deletedSupplier = { id: 1, name: 'Deleted Supplier' };

      db.query.mockResolvedValueOnce({ rows: [deletedSupplier] });

      const result = await Supplier.delete(1);

      expect(db.query).toHaveBeenCalledWith('DELETE FROM suppliers WHERE id = $1 RETURNING *', [1]);
      expect(result).toEqual(deletedSupplier);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return null when supplier not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Supplier.delete(999);

      expect(result).toBeNull();
    });
  });
});
