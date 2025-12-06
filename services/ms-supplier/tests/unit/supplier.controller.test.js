/**
 * Unit Tests for Supplier Controller
 * Tests the SupplierController methods with mocked model
 */

// Mock the Supplier model
jest.mock('../../src/models/supplier.model', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const supplierController = require('../../src/controllers/supplier.controller');
const Supplier = require('../../src/models/supplier.model');

describe('SupplierController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create supplier and return 201', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'test@test.com',
        contact_person: 'John Doe',
        phone: '123-456-7890'
      };

      const createdSupplier = { id: 1, ...supplierData };

      mockReq.body = supplierData;
      Supplier.create.mockResolvedValueOnce(createdSupplier);

      await supplierController.createSupplier(mockReq, mockRes);

      expect(Supplier.create).toHaveBeenCalledWith(supplierData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Supplier created successfully',
        data: createdSupplier
      });
    });

    it('should return 500 on error', async () => {
      mockReq.body = { name: 'Test' };
      Supplier.create.mockRejectedValueOnce(new Error('Database error'));

      await supplierController.createSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating supplier',
        error: 'Database error'
      });
    });
  });

  describe('getAllSuppliers', () => {
    it('should return all suppliers', async () => {
      const suppliers = [
        { id: 1, name: 'Supplier 1' },
        { id: 2, name: 'Supplier 2' }
      ];

      Supplier.findAll.mockResolvedValueOnce(suppliers);

      await supplierController.getAllSuppliers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: suppliers
      });
    });

    it('should apply filters from query params', async () => {
      mockReq.query = { status: 'active', search: 'test', limit: '10' };
      Supplier.findAll.mockResolvedValueOnce([]);

      await supplierController.getAllSuppliers(mockReq, mockRes);

      expect(Supplier.findAll).toHaveBeenCalledWith({
        status: 'active',
        search: 'test',
        limit: 10
      });
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier when found', async () => {
      const supplier = { id: 1, name: 'Test Supplier' };
      mockReq.params.id = '1';

      Supplier.findById.mockResolvedValueOnce(supplier);

      await supplierController.getSupplierById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: supplier
      });
    });

    it('should return 404 when supplier not found', async () => {
      mockReq.params.id = '999';
      Supplier.findById.mockResolvedValueOnce(null);

      await supplierController.getSupplierById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier not found'
      });
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier successfully', async () => {
      const updatedSupplier = { id: 1, name: 'Updated Supplier' };
      mockReq.params.id = '1';
      mockReq.body = { name: 'Updated Supplier' };

      Supplier.update.mockResolvedValueOnce(updatedSupplier);

      await supplierController.updateSupplier(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Supplier updated successfully',
        data: updatedSupplier
      });
    });

    it('should return 404 when supplier not found', async () => {
      mockReq.params.id = '999';
      mockReq.body = { name: 'Updated' };
      Supplier.update.mockResolvedValueOnce(null);

      await supplierController.updateSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteSupplier', () => {
    it('should delete supplier successfully', async () => {
      const deletedSupplier = { id: 1, name: 'Deleted Supplier' };
      mockReq.params.id = '1';

      Supplier.delete.mockResolvedValueOnce(deletedSupplier);

      await supplierController.deleteSupplier(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Supplier deleted successfully',
        data: deletedSupplier
      });
    });

    it('should return 404 when supplier not found', async () => {
      mockReq.params.id = '999';
      Supplier.delete.mockResolvedValueOnce(null);

      await supplierController.deleteSupplier(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
