# Test Runner - Example Requests

This directory contains example JSON payloads for different test scenarios.

## Usage

### Using cURL

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d @examples/smoke-test-user-auth.json
```

### Using HTTPie

```bash
http POST http://localhost:3007/api/tests/run < examples/smoke-test-user-auth.json
```

### Using Postman

1. Import the JSON files
2. Set the URL to `http://localhost:3007/api/tests/run`
3. Set method to POST
4. Set body to raw JSON
5. Paste the content from the example file

---

## Examples

### Smoke Tests

| File | Description |
|------|-------------|
| `smoke-test-user-auth.json` | Smoke test with user authentication |
| `smoke-test-m2m-auth.json` | Smoke test with M2M authentication |
| `smoke-test-env-defaults.json` | Smoke test using environment defaults |

### Load Tests

| File | Description |
|------|-------------|
| `load-test-single-service.json` | Load test targeting one service |
| `load-test-multiple-services.json` | Load test across multiple services |
| `load-test-custom-stages.json` | Load test with custom ramp-up stages |
| `load-test-with-webhook.json` | Load test with webhook callback |

---

## Testing Workflow

1. **Start the test**:
   ```bash
   curl -X POST http://localhost:3007/api/tests/run \
     -H "Content-Type: application/json" \
     -d @examples/smoke-test-user-auth.json
   ```

2. **Get the test ID** from the response:
   ```json
   {
     "testId": "1702469834567",
     "status": "running"
   }
   ```

3. **Check status**:
   ```bash
   curl http://localhost:3007/api/tests/1702469834567/status
   ```

4. **View logs**:
   ```bash
   curl http://localhost:3007/api/tests/1702469834567/logs
   ```

---

## Customization

### Modify for Your Environment

**Local Development**:
```json
{
  "gatewayUrl": "http://localhost:5173",
  "serviceUrls": {
    "product": "http://localhost:3002"
  }
}
```

**Docker Compose**:
```json
{
  "gatewayUrl": "http://host.docker.internal:5173",
  "serviceUrls": {
    "product": "http://host.docker.internal:3002"
  }
}
```

**Kubernetes**:
```json
{
  "gatewayUrl": "http://gateway-service:5173",
  "serviceUrls": {
    "product": "http://product-service:3002",
    "inventory": "http://inventory-service:3003"
  }
}
```

### Adjust Load

**Light Load** (5 users, 30 seconds):
```json
{
  "vus": 5,
  "duration": "30s"
}
```

**Medium Load** (50 users, 2 minutes):
```json
{
  "vus": 50,
  "duration": "2m"
}
```

**Heavy Load** (200 users with stages):
```json
{
  "stages": [
    { "duration": "1m", "target": 50 },
    { "duration": "2m", "target": 100 },
    { "duration": "2m", "target": 200 },
    { "duration": "1m", "target": 0 }
  ]
}
```

---

## Authentication Examples

### User Login
```json
{
  "auth": {
    "username": "user@example.com",
    "password": "password123"
  }
}
```

### M2M Client Credentials
```json
{
  "auth": {
    "useM2M": true
  }
}
```

### Environment Defaults
```json
{}
// No auth object - uses ASGARDEO_USERNAME/PASSWORD or M2M from env
```

---

## Tips

- Start with smoke tests to verify connectivity
- Use small VU counts initially to test configuration
- Monitor service resource usage during load tests
- Review logs for detailed information
- Use webhooks for automated reporting
