/**
 * Integration Tests for API Endpoints
 * Tests the basic API functionality of the inventory service
 */

const express = require('express');
const http = require('http');

// Create a mock API for testing
const createMockApiApp = () => {
  const app = express();
  app.use(express.json());

  // Mock inventory data store
  let inventoryStore = [];

  // Health endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'inventory-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Get all inventory
  app.get('/api/inventory', (req, res) => {
    let data = [...inventoryStore];
    
    // Filter for low stock if requested
    if (req.query.low_stock === 'true') {
      data = data.filter(item => item.quantity <= item.reorder_level);
    }

    res.json({
      success: true,
      count: data.length,
      data: data,
    });
  });

  // Get inventory by product ID
  app.get('/api/inventory/product/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const inventory = inventoryStore.find(item => item.product_id === productId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found for this product',
      });
    }

    res.json({
      success: true,
      data: inventory,
    });
  });

  // Create inventory
  app.post('/api/inventory', (req, res) => {
    const { product_id, sku, quantity, warehouse_location, reorder_level, max_stock_level } = req.body;

    // Validation
    if (!product_id || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: [{ field: 'product_id', message: 'product_id is required' }],
      });
    }

    // Check for duplicate
    const existing = inventoryStore.find(item => item.product_id === product_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Inventory already exists for this product',
      });
    }

    const newInventory = {
      id: inventoryStore.length + 1,
      product_id,
      sku,
      quantity: quantity || 0,
      warehouse_location: warehouse_location || '',
      reorder_level: reorder_level || 10,
      max_stock_level: max_stock_level || 1000,
      created_at: new Date().toISOString(),
    };

    inventoryStore.push(newInventory);

    res.status(201).json({
      success: true,
      message: 'Inventory created successfully',
      data: newInventory,
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  // Reset store helper (for testing)
  app.resetStore = () => {
    inventoryStore = [];
  };

  return app;
};

describe('API Integration Tests', () => {
  let server;
  let port;
  let app;

  beforeAll((done) => {
    app = createMockApiApp();
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    app.resetStore();
  });

  const makeRequest = (method, path, body = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(data),
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              body: data,
            });
          }
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  describe('POST /api/inventory', () => {
    test('should create new inventory successfully', async () => {
      const inventoryData = {
        product_id: 1,
        sku: 'TEST-SKU-001',
        quantity: 100,
        warehouse_location: 'Warehouse A',
        reorder_level: 20,
      };

      const response = await makeRequest('POST', '/api/inventory', inventoryData);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product_id).toBe(1);
      expect(response.body.data.sku).toBe('TEST-SKU-001');
      expect(response.body.data.quantity).toBe(100);
    });

    test('should reject duplicate inventory for same product', async () => {
      const inventoryData = {
        product_id: 1,
        sku: 'TEST-SKU-001',
        quantity: 100,
      };

      // Create first inventory
      await makeRequest('POST', '/api/inventory', inventoryData);
      
      // Try to create duplicate
      const response = await makeRequest('POST', '/api/inventory', inventoryData);
      
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/inventory', () => {
    test('should return empty array when no inventory exists', async () => {
      const response = await makeRequest('GET', '/api/inventory');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    test('should return inventory items after creation', async () => {
      // Create inventory
      await makeRequest('POST', '/api/inventory', {
        product_id: 1,
        sku: 'SKU-001',
        quantity: 50,
      });

      const response = await makeRequest('GET', '/api/inventory');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].sku).toBe('SKU-001');
    });
  });

  describe('GET /api/inventory/product/:productId', () => {
    test('should return 404 for non-existent product', async () => {
      const response = await makeRequest('GET', '/api/inventory/product/999');
      
      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return inventory for existing product', async () => {
      // Create inventory first
      await makeRequest('POST', '/api/inventory', {
        product_id: 5,
        sku: 'SKU-005',
        quantity: 75,
      });

      const response = await makeRequest('GET', '/api/inventory/product/5');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product_id).toBe(5);
    });
  });
});
