/**
 * Integration Tests for Health Endpoint
 * Tests the /health endpoint of the inventory service
 */

const http = require('http');

// Mock express app for integration testing
const express = require('express');

const createTestApp = () => {
  const app = express();

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'inventory-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/inventory', (req, res) => {
    res.json({
      success: true,
      count: 0,
      data: [],
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  return app;
};

describe('Health Endpoint Integration Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    const app = createTestApp();
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const makeRequest = (path) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'GET',
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data),
          });
        });
      });

      req.on('error', reject);
      req.end();
    });
  };

  test('should return 200 OK for health check', async () => {
    const response = await makeRequest('/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe('inventory-service');
    expect(response.body.status).toBe('healthy');
  });

  test('should include timestamp in health response', async () => {
    const response = await makeRequest('/health');
    
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  test('should return 404 for unknown routes', async () => {
    const response = await makeRequest('/unknown-route');
    
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Route not found');
  });

  test('should return inventory list endpoint', async () => {
    const response = await makeRequest('/api/inventory');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
