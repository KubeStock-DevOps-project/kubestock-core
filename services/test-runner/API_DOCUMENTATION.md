# Test Runner Service - API Documentation

## Overview

The Test Runner service provides a REST API to execute K6 performance tests with full control over test configuration, authentication, and target URLs. It supports two types of tests:

1. **Smoke Tests**: Quick health checks through the API Gateway
2. **Load Tests**: Performance testing with direct microservice calls

## Features

- ✅ **Flexible Authentication**
  - User login with username/password
  - Machine-to-Machine (M2M) client credentials
  - Environment variable defaults
  
- ✅ **Configurable Test Parameters**
  - Control VUs (Virtual Users) and duration
  - Custom load test stages
  - Specify target URLs per test run
  
- ✅ **Two Test Modes**
  - Smoke tests via API Gateway
  - Load tests with direct microservice access

## Authentication Methods

### 1. User Login (Resource Owner Password Credentials)

When `username` and `password` are provided in the request body:

```json
{
  "auth": {
    "username": "testuser@example.com",
    "password": "SecurePassword123"
  }
}
```

### 2. M2M Client Credentials

Force M2M authentication:

```json
{
  "auth": {
    "useM2M": true
  }
}
```

### 3. Environment Variable Defaults

If no `auth` object is provided, the service uses environment variables:

- **User Login**: If `ASGARDEO_USERNAME` and `ASGARDEO_PASSWORD` are set
- **M2M**: If only `ASGARDEO_CLIENT_ID` and `ASGARDEO_CLIENT_SECRET` are set

## Environment Variables

```bash
# Required for all authentication methods
ASGARDEO_TOKEN_URL=https://api.asgardeo.io/t/yourorg/oauth2/token
ASGARDEO_CLIENT_ID=your_client_id
ASGARDEO_CLIENT_SECRET=your_client_secret

# Optional - User authentication defaults
ASGARDEO_USERNAME=user@example.com
ASGARDEO_PASSWORD=password123

# Optional - Default gateway URL
GATEWAY_URL=http://localhost:5173

# Service configuration
PORT=3007
HOST=0.0.0.0
```

## API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "UP",
  "service": "test-runner"
}
```

---

### 2. Run Test

```http
POST /api/tests/run
Content-Type: application/json
```

**Request Body Schema:**

```typescript
{
  testType: 'smoke' | 'load',           // Test type (required)
  vus?: number,                         // Virtual users (default: 1)
  duration?: string,                    // Test duration (default: '5s')
  stages?: Array<{                      // Load test stages (optional)
    duration: string,
    target: number
  }>,
  gatewayUrl?: string,                  // Gateway URL for smoke tests
  serviceUrls?: {                       // Service URLs
    product?: string,
    inventory?: string,
    supplier?: string,
    order?: string,
    identity?: string
  },
  auth?: {                              // Authentication (optional)
    username?: string,                  // User login
    password?: string,                  // User login
    useM2M?: boolean                    // Force M2M auth
  },
  webhookUrl?: string                   // Callback URL (optional)
}
```

**Response (202 Accepted):**
```json
{
  "message": "Test run accepted",
  "testId": "1702469834567",
  "status": "running",
  "testType": "smoke",
  "links": {
    "status": "/api/tests/1702469834567/status",
    "logs": "/api/tests/1702469834567/logs"
  }
}
```

---

### 3. Get Test Status

```http
GET /api/tests/:testId/status
```

**Response:**
```json
{
  "id": "1702469834567",
  "status": "completed",
  "exitCode": 0,
  "startTime": "2025-12-13T10:30:00.000Z",
  "endTime": "2025-12-13T10:30:05.000Z"
}
```

Status values: `running`, `completed`, `failed`

---

### 4. Get Test Logs

```http
GET /api/tests/:testId/logs
```

**Response:**
```json
{
  "id": "1702469834567",
  "logs": [
    "🔍 Running smoke tests through gateway: http://localhost:5173",
    "✅ Gateway Health Check",
    "✅ Product Service UP (via Gateway)",
    ...
  ]
}
```

---

## Usage Examples

### Example 1: Smoke Test via Gateway (User Auth)

Test all services through the API gateway with user authentication:

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "smoke",
    "vus": 1,
    "duration": "10s",
    "gatewayUrl": "http://localhost:5173",
    "auth": {
      "username": "admin@kubestock.com",
      "password": "Admin123!"
    }
  }'
```

### Example 2: Smoke Test via Gateway (M2M Auth)

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "smoke",
    "gatewayUrl": "http://gateway.example.com",
    "auth": {
      "useM2M": true
    }
  }'
```

### Example 3: Load Test - Single Service (Direct Call)

Direct load test on the Product service:

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "load",
    "serviceUrls": {
      "product": "http://product-service:3002"
    },
    "stages": [
      { "duration": "30s", "target": 50 },
      { "duration": "1m", "target": 50 },
      { "duration": "20s", "target": 0 }
    ],
    "auth": {
      "username": "loadtest@kubestock.com",
      "password": "LoadTest123!"
    }
  }'
```

### Example 4: Load Test - Multiple Services

Distributed load across multiple services:

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "load",
    "vus": 100,
    "duration": "2m",
    "serviceUrls": {
      "product": "http://product-service:3002",
      "inventory": "http://inventory-service:3003",
      "order": "http://order-service:3005"
    }
  }'
```

### Example 5: Load Test with Custom Stages

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "load",
    "serviceUrls": {
      "inventory": "http://inventory-service:3003"
    },
    "stages": [
      { "duration": "2m", "target": 100 },
      { "duration": "5m", "target": 100 },
      { "duration": "2m", "target": 200 },
      { "duration": "5m", "target": 200 },
      { "duration": "2m", "target": 0 }
    ]
  }'
```

### Example 6: Using Default Environment Variables

If environment variables are configured:

```bash
# Simple smoke test using defaults
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"testType": "smoke"}'
```

### Example 7: With Webhook Callback

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "smoke",
    "gatewayUrl": "http://localhost:5173",
    "webhookUrl": "http://callback-service:8080/test-complete"
  }'
```

---

## Test Types Explained

### Smoke Tests (`testType: "smoke"`)

**Purpose**: Quick health checks to verify all services are operational

**Characteristics**:
- Routes through the API Gateway
- Checks all service endpoints with `/api/service` prefix
- Minimal load (typically 1 VU)
- Short duration (5-30 seconds)

**Default URLs**:
- Gateway: `http://localhost:5173`
- Services accessed via: `{gatewayUrl}/api/{service}`

**Example Flow**:
1. Check gateway health
2. Check Product Service: `GET {gatewayUrl}/api/product`
3. Check Inventory Service: `GET {gatewayUrl}/api/inventory`
4. Check Supplier Service: `GET {gatewayUrl}/api/supplier`
5. Check Order Service: `GET {gatewayUrl}/api/order`
6. Check Identity Service: `GET {gatewayUrl}/api/identity/health`

---

### Load Tests (`testType: "load"`)

**Purpose**: Performance and stress testing of individual microservices

**Characteristics**:
- Direct service calls (no gateway)
- No `/api/` prefix in URLs
- High load with multiple VUs
- Longer duration with ramp-up/down stages
- Can target single or multiple services

**URL Format**:
- Direct: `http://service-name:port`
- Example: `http://product-service:3002`

**Example Flow**:
1. Randomly select a service from provided URLs
2. Send GET request directly to service
3. Verify response status and performance
4. Repeat for configured duration/stages

---

## Service URL Format Reference

### Smoke Tests (via Gateway)

```json
{
  "gatewayUrl": "http://gateway-service:5173",
  "serviceUrls": {
    "product": "http://gateway-service:5173/api/product",
    "inventory": "http://gateway-service:5173/api/inventory"
  }
}
```

### Load Tests (Direct)

```json
{
  "serviceUrls": {
    "product": "http://product-service:3002",
    "inventory": "http://inventory-service:3003",
    "supplier": "http://supplier-service:3004",
    "order": "http://order-service:3005",
    "identity": "http://identity-service:3006"
  }
}
```

---

## Error Handling

### Authentication Errors

```json
{
  "error": "Authentication failed",
  "details": "Invalid username or password"
}
```

### Invalid Test Type

```json
{
  "error": "Invalid test type: invalid"
}
```

### Missing Service URLs for Load Test

```json
{
  "error": "Load tests require at least one service URL in serviceUrls (product, inventory, supplier, order)"
}
```

---

## Webhook Callback Format

If `webhookUrl` is provided, the service will POST to that URL when the test completes:

```json
{
  "testId": "1702469834567",
  "status": "completed",
  "exitCode": 0,
  "startTime": "2025-12-13T10:30:00.000Z",
  "endTime": "2025-12-13T10:30:05.000Z"
}
```

---

## Docker Usage

### Build

```bash
docker build -t test-runner:latest .
```

### Run

```bash
docker run -d \
  -p 3007:3007 \
  -e ASGARDEO_TOKEN_URL=https://api.asgardeo.io/t/yourorg/oauth2/token \
  -e ASGARDEO_CLIENT_ID=your_client_id \
  -e ASGARDEO_CLIENT_SECRET=your_client_secret \
  -e ASGARDEO_USERNAME=user@example.com \
  -e ASGARDEO_PASSWORD=password123 \
  -e GATEWAY_URL=http://gateway:5173 \
  --name test-runner \
  test-runner:latest
```

---

## Logs

Test logs are stored in `/app/logs/{testId}.log` inside the container.

Mount a volume to persist logs:

```bash
docker run -d \
  -p 3007:3007 \
  -v $(pwd)/logs:/app/logs \
  test-runner:latest
```

---

## Best Practices

### Smoke Tests
- Use short duration (5-30s)
- Run through gateway to test full stack
- Schedule regularly (e.g., every 5 minutes)
- Monitor for any service failures

### Load Tests
- Target services directly for accurate metrics
- Use gradual ramp-up stages
- Monitor resource usage on target services
- Run during maintenance windows for high load

### Authentication
- Use M2M for automated/scheduled tests
- Use user auth when testing user-specific flows
- Rotate credentials regularly
- Never commit credentials to version control

---

## Troubleshooting

### Test fails with authentication error
- Verify `ASGARDEO_*` environment variables
- Check client credentials are correct
- Ensure user has required permissions

### Gateway URL unreachable in smoke tests
- Verify gateway is running
- Check network connectivity
- Use `host.docker.internal` for Docker Desktop

### Direct service calls fail in load tests
- Ensure services are accessible from test runner
- Use correct service discovery names in Kubernetes
- Verify no `/api/` prefix in service URLs

### Tests don't start
- Check k6 is installed in the container
- Verify test scripts exist in `/app/src/k6/`
- Check Docker logs: `docker logs test-runner`

---

## Migration from Old API

### Old Request Format
```json
{
  "targetUrl": "http://gateway:5173",
  "serviceUrls": {...}
}
```

### New Request Format
```json
{
  "testType": "smoke",
  "gatewayUrl": "http://gateway:5173",
  "serviceUrls": {...}
}
```

**Key Changes**:
- ✅ `targetUrl` → `gatewayUrl` (for smoke tests)
- ✅ `BASE_URL` → `GATEWAY_URL` (in K6 scripts)
- ✅ Added `auth` object for credentials
- ✅ Added `testType` to distinguish smoke vs load
- ✅ Load tests now require direct service URLs

---

## Support

For issues or questions:
- Check logs: `/api/tests/{testId}/logs`
- Review K6 documentation: https://k6.io/docs/
- Check service health endpoints
