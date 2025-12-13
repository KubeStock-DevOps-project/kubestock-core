# Test Runner - Quick Reference

## 🚀 Start Service

```bash
npm install
npm start
# Service runs on http://localhost:3007
```

---

## 📋 Common Commands

### Smoke Test (Gateway)
```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "smoke",
    "gatewayUrl": "http://localhost:5173",
    "auth": {
      "username": "user@example.com",
      "password": "password"
    }
  }'
```

### Load Test (Direct)
```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "load",
    "serviceUrls": {
      "product": "http://localhost:3002"
    },
    "vus": 50,
    "duration": "1m"
  }'
```

### Check Status
```bash
curl http://localhost:3007/api/tests/{testId}/status
```

### View Logs
```bash
curl http://localhost:3007/api/tests/{testId}/logs
```

---

## 🔑 Authentication Modes

| Mode | Request Body | Use Case |
|------|--------------|----------|
| **User Login** | `{"auth": {"username": "...", "password": "..."}}` | Test user access |
| **M2M** | `{"auth": {"useM2M": true}}` | Service-to-service |
| **Env Default** | No auth object | Use env variables |

---

## 📊 Test Types

### Smoke Test
- **Purpose**: Health checks
- **Route**: Through API Gateway
- **URLs**: `{gateway}/api/{service}`
- **Load**: Low (1-5 VUs)

### Load Test
- **Purpose**: Performance testing
- **Route**: Direct to services
- **URLs**: `http://service:port` (no /api)
- **Load**: High (50-500+ VUs)

---

## 🌐 URL Formats

### Local Development
```json
{
  "gatewayUrl": "http://localhost:5173",
  "serviceUrls": {
    "product": "http://localhost:3002"
  }
}
```

### Docker
```json
{
  "gatewayUrl": "http://host.docker.internal:5173",
  "serviceUrls": {
    "product": "http://host.docker.internal:3002"
  }
}
```

### Kubernetes
```json
{
  "gatewayUrl": "http://gateway-service:5173",
  "serviceUrls": {
    "product": "http://product-service:3002"
  }
}
```

---

## ⚙️ Environment Variables

```bash
# Required
ASGARDEO_TOKEN_URL=https://api.asgardeo.io/t/org/oauth2/token
ASGARDEO_CLIENT_ID=your_client_id
ASGARDEO_CLIENT_SECRET=your_client_secret

# Optional
ASGARDEO_USERNAME=user@example.com
ASGARDEO_PASSWORD=password
GATEWAY_URL=http://localhost:5173
```

---

## 📁 Example Files

```bash
# Use pre-made examples
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d @examples/smoke-test-user-auth.json

curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d @examples/load-test-single-service.json
```

---

## 🐛 Troubleshooting

### Auth fails
- Check `ASGARDEO_*` env variables
- Verify username/password are correct

### Can't reach gateway
- Use `host.docker.internal` in Docker
- Check gateway is running on port 5173

### Load test connection refused
- Use direct URLs (no /api prefix)
- Verify services are accessible

---

## 📚 More Info

- [Full API Docs](API_DOCUMENTATION.md)
- [Complete README](README.md)
- [Examples](examples/README.md)
- [Refactoring Summary](REFACTORING_SUMMARY.md)
