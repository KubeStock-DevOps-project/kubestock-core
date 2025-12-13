# Test Runner - Refactoring Summary

## Changes Implemented

### 1. ✅ User Authentication Support

**File**: [auth.js](src/auth.js)

**Changes**:
- Added `getUserAccessToken()` function for Resource Owner Password Credentials grant
- Added `getM2MAccessToken()` function (renamed from `getAccessToken()`)
- Main `getAccessToken()` function now checks for username/password in env variables first
- Falls back to M2M if user credentials not provided

**How it works**:
```javascript
// Priority:
// 1. If ASGARDEO_USERNAME + ASGARDEO_PASSWORD -> User login
// 2. Otherwise -> M2M client credentials
```

---

### 2. ✅ External Configuration via REST API

**File**: [server.js](src/server.js)

**Changes**:
- Complete request body schema redesign
- All test parameters now configurable per request
- Added `auth` object in request body for per-request authentication
- Separated smoke test (gateway) and load test (direct) configurations
- Added validation for test types and required parameters

**New Request Structure**:
```json
{
  "testType": "smoke" | "load",
  "vus": 50,
  "duration": "1m",
  "stages": [...],
  "gatewayUrl": "...",
  "serviceUrls": {...},
  "auth": {
    "username": "...",
    "password": "...",
    "useM2M": true
  },
  "webhookUrl": "..."
}
```

---

### 3. ✅ Smoke Tests via Gateway

**File**: [src/k6/smoke.js](src/k6/smoke.js)

**Changes**:
- Changed `BASE_URL` to `GATEWAY_URL` for clarity
- All service checks now explicitly route through gateway
- Added gateway health check as first test
- Updated console logs to show "via Gateway"
- Default URL changed to match gateway configuration

**URL Pattern**:
```javascript
// OLD: http://localhost:5173/api/product
// NEW: {GATEWAY_URL}/api/product
```

---

### 4. ✅ Load Tests with Direct Microservice Calls

**File**: [src/k6/load.js](src/k6/load.js)

**Changes**:
- Removed `BASE_URL` dependency
- Direct service URLs only (no gateway routing)
- Added support for custom stages via `STAGES` environment variable
- Added error if no service URLs provided
- Enhanced logging to show which services are being tested
- Added response time checks

**URL Pattern**:
```javascript
// Direct service calls (no /api prefix)
// Example: http://product-service:3002
```

**Stage Configuration**:
```javascript
// Can be configured via request body
"stages": [
  { "duration": "30s", "target": 50 },
  { "duration": "1m", "target": 100 }
]
```

---

## New Features

### 1. Flexible Authentication

Three authentication modes:

| Mode | Configuration | Use Case |
|------|---------------|----------|
| User Login (Request) | `auth.username` + `auth.password` in body | Per-test user authentication |
| M2M (Request) | `auth.useM2M: true` in body | Force M2M for specific test |
| Environment Default | `ASGARDEO_USERNAME` + `ASGARDEO_PASSWORD` in env | Default user for all tests |

### 2. Test Type Separation

| Test Type | Purpose | URL Format | Example |
|-----------|---------|------------|---------|
| `smoke` | Health checks via gateway | `{gateway}/api/{service}` | `http://gateway:5173/api/product` |
| `load` | Performance testing | Direct service URL | `http://product-service:3002` |

### 3. Complete External Control

Everything can be configured via API request:
- ✅ Test type (smoke/load)
- ✅ Virtual users and duration
- ✅ Load test stages
- ✅ Gateway URL (smoke tests)
- ✅ Service URLs (load tests)
- ✅ Authentication credentials
- ✅ Webhook callbacks

---

## Migration Guide

### Old API Usage
```json
{
  "testType": "smoke",
  "targetUrl": "http://localhost:5173",
  "serviceUrls": {
    "product": "http://localhost:5173/api/product"
  }
}
```

### New API Usage

**Smoke Test**:
```json
{
  "testType": "smoke",
  "gatewayUrl": "http://localhost:5173",
  "auth": {
    "username": "user@example.com",
    "password": "password"
  }
}
```

**Load Test**:
```json
{
  "testType": "load",
  "serviceUrls": {
    "product": "http://localhost:3002"
  },
  "vus": 50,
  "duration": "2m"
}
```

---

## File Structure

```
test-runner/
├── src/
│   ├── server.js              # ✨ Refactored with new API
│   ├── auth.js                # ✨ Added user authentication
│   ├── k6/
│   │   ├── smoke.js           # ✨ Gateway-focused tests
│   │   └── load.js            # ✨ Direct service load tests
│   └── public/
├── examples/                  # 🆕 Example request JSONs
│   ├── smoke-test-user-auth.json
│   ├── smoke-test-m2m-auth.json
│   ├── load-test-single-service.json
│   ├── load-test-custom-stages.json
│   └── README.md
├── logs/
├── .env.example               # 🆕 Environment template
├── README.md                  # 🆕 Complete guide
├── API_DOCUMENTATION.md       # 🆕 Full API reference
├── REFACTORING_SUMMARY.md     # 📄 This file
├── Dockerfile
└── package.json
```

---

## Testing the Changes

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Service
```bash
npm install
npm start
```

### 3. Run Smoke Test
```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d @examples/smoke-test-user-auth.json
```

### 4. Run Load Test
```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d @examples/load-test-single-service.json
```

### 5. Check Results
```bash
# Get test ID from response, then:
curl http://localhost:3007/api/tests/{testId}/status
curl http://localhost:3007/api/tests/{testId}/logs
```

---

## Key Improvements

### Before
- ❌ Only M2M authentication
- ❌ Mixed smoke/load configuration
- ❌ Limited configuration options
- ❌ No clear separation between test types

### After
- ✅ User login + M2M authentication
- ✅ Clear smoke (gateway) vs load (direct) separation
- ✅ Full external configuration control
- ✅ Per-request authentication
- ✅ Custom load test stages
- ✅ Comprehensive documentation
- ✅ Ready-to-use examples

---

## Gateway Configuration Awareness

The smoke tests are designed to work with the Nginx gateway configuration:

**Gateway routes** (from [gateway/nginx.conf](../../gateway/nginx.conf)):
```nginx
location /api/product/ {
    rewrite ^/api/product/(.*)$ /$1 break;
    proxy_pass http://host.docker.internal:3002;
}
```

**Smoke test calls**:
```javascript
GET {GATEWAY_URL}/api/product
// Gateway strips /api/product and forwards to service
```

**Load test calls** (direct):
```javascript
GET http://product-service:3002
// Direct call, no gateway routing
```

---

## Environment Variables Reference

### Required
```bash
ASGARDEO_TOKEN_URL=https://api.asgardeo.io/t/org/oauth2/token
ASGARDEO_CLIENT_ID=your_client_id
ASGARDEO_CLIENT_SECRET=your_client_secret
```

### Optional
```bash
# User authentication default
ASGARDEO_USERNAME=user@example.com
ASGARDEO_PASSWORD=password123

# Gateway URL default
GATEWAY_URL=http://localhost:5173

# Service config
PORT=3007
HOST=0.0.0.0
```

---

## Next Steps

1. ✅ Test with real Asgardeo credentials
2. ✅ Verify gateway routing works correctly
3. ✅ Test load tests against actual services
4. ✅ Set up CI/CD integration
5. ✅ Configure monitoring/alerting for test results
6. ✅ Create Kubernetes deployment manifests

---

## Documentation

- **[README.md](README.md)**: Quick start guide with examples
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)**: Complete API reference
- **[examples/README.md](examples/README.md)**: Usage examples
- **[.env.example](.env.example)**: Environment configuration template

---

## Support

For questions or issues:
1. Check the [API Documentation](API_DOCUMENTATION.md)
2. Review [example requests](examples/)
3. Check test logs: `GET /api/tests/{id}/logs`
4. Verify environment configuration

---

**Summary**: The test runner has been completely refactored to support flexible authentication, external configuration, and clear separation between smoke tests (via gateway) and load tests (direct service calls). All requirements have been implemented with comprehensive documentation and ready-to-use examples.
