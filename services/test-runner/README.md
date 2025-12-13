# Test Runner Service 🧪

REST API service for executing K6 performance tests with flexible configuration and authentication options.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Asgardeo credentials
```

### 3. Start Service

```bash
npm start
```

Service will be available at `http://localhost:3007`

---

## Features

- ✅ **Flexible Authentication**: User login or M2M client credentials
- ✅ **Two Test Types**: Smoke tests (via gateway) and Load tests (direct)
- ✅ **Configurable Parameters**: VUs, duration, stages, target URLs
- ✅ **Async Execution**: Non-blocking test execution with status tracking
- ✅ **Webhook Support**: Optional callbacks on test completion

---

## Quick Examples

### Smoke Test (Gateway)

Test all services through the API gateway:

```bash
curl -X POST http://localhost:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "smoke",
    "gatewayUrl": "http://localhost:5173",
    "auth": {
      "username": "admin@example.com",
      "password": "password123"
    }
  }'
```

### Load Test (Direct)

Performance test a specific service:

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

### Check Test Status

```bash
curl http://localhost:3007/api/tests/{testId}/status
```

---

## Test Types

### 🔍 Smoke Tests

**Purpose**: Quick health checks via API Gateway

**Use Cases**:
- Verify all services are operational
- Pre-deployment validation
- Continuous monitoring
- Integration testing

**Configuration**:
```json
{
  "testType": "smoke",
  "gatewayUrl": "http://gateway:5173",
  "vus": 1,
  "duration": "10s"
}
```

**URL Format**: `{gatewayUrl}/api/{service}`

---

### 📊 Load Tests

**Purpose**: Performance testing with direct service calls

**Use Cases**:
- Stress testing individual services
- Capacity planning
- Performance benchmarking
- Bottleneck identification

**Configuration**:
```json
{
  "testType": "load",
  "serviceUrls": {
    "product": "http://product-service:3002",
    "inventory": "http://inventory-service:3003"
  },
  "stages": [
    { "duration": "30s", "target": 50 },
    { "duration": "1m", "target": 100 },
    { "duration": "30s", "target": 0 }
  ]
}
```

**URL Format**: Direct service URL (no `/api/` prefix)

---

## Authentication

### Option 1: User Login (Per Request)

```json
{
  "auth": {
    "username": "user@example.com",
    "password": "SecurePass123"
  }
}
```

### Option 2: M2M Client Credentials (Per Request)

```json
{
  "auth": {
    "useM2M": true
  }
}
```

### Option 3: Environment Variables (Default)

```bash
# User authentication (priority)
ASGARDEO_USERNAME=user@example.com
ASGARDEO_PASSWORD=password123

# OR M2M authentication (fallback)
# Just set CLIENT_ID and CLIENT_SECRET
```

---

## API Endpoints

### `POST /api/tests/run`

Start a new test run

**Request Body**:
```typescript
{
  testType: 'smoke' | 'load',
  vus?: number,
  duration?: string,
  stages?: Array<{duration: string, target: number}>,
  gatewayUrl?: string,
  serviceUrls?: {
    product?: string,
    inventory?: string,
    supplier?: string,
    order?: string,
    identity?: string
  },
  auth?: {
    username?: string,
    password?: string,
    useM2M?: boolean
  },
  webhookUrl?: string
}
```

**Response (202)**:
```json
{
  "message": "Test run accepted",
  "testId": "1702469834567",
  "status": "running",
  "links": {
    "status": "/api/tests/1702469834567/status",
    "logs": "/api/tests/1702469834567/logs"
  }
}
```

### `GET /api/tests/:testId/status`

Get test execution status

**Response**:
```json
{
  "id": "1702469834567",
  "status": "completed",
  "exitCode": 0,
  "startTime": "2025-12-13T10:30:00.000Z",
  "endTime": "2025-12-13T10:30:05.000Z"
}
```

### `GET /api/tests/:testId/logs`

Get test execution logs

**Response**:
```json
{
  "id": "1702469834567",
  "logs": ["log line 1", "log line 2", ...]
}
```

### `GET /health`

Service health check

**Response**:
```json
{
  "status": "UP",
  "service": "test-runner"
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3007` | Service port |
| `HOST` | No | `127.0.0.1` | Service host |
| `ASGARDEO_TOKEN_URL` | Yes | - | Asgardeo token endpoint |
| `ASGARDEO_CLIENT_ID` | Yes | - | OAuth client ID |
| `ASGARDEO_CLIENT_SECRET` | Yes | - | OAuth client secret |
| `ASGARDEO_USERNAME` | No | - | Default user for authentication |
| `ASGARDEO_PASSWORD` | No | - | Default user password |
| `GATEWAY_URL` | No | `http://host.docker.internal:5173` | Default gateway URL |

---

## Docker Usage

### Build Image

```bash
docker build -t test-runner:latest .
```

### Run Container

```bash
docker run -d \
  -p 3007:3007 \
  -e ASGARDEO_TOKEN_URL=https://api.asgardeo.io/t/yourorg/oauth2/token \
  -e ASGARDEO_CLIENT_ID=your_client_id \
  -e ASGARDEO_CLIENT_SECRET=your_client_secret \
  -v $(pwd)/logs:/app/logs \
  --name test-runner \
  test-runner:latest
```

### Docker Compose

```yaml
services:
  test-runner:
    build: .
    ports:
      - "3007:3007"
    environment:
      - ASGARDEO_TOKEN_URL=${ASGARDEO_TOKEN_URL}
      - ASGARDEO_CLIENT_ID=${ASGARDEO_CLIENT_ID}
      - ASGARDEO_CLIENT_SECRET=${ASGARDEO_CLIENT_SECRET}
      - GATEWAY_URL=http://gateway:5173
    volumes:
      - ./logs:/app/logs
```

---

## Real-World Examples

### Example 1: Pre-Deployment Smoke Test

```bash
#!/bin/bash
# Run before deploying to production

RESPONSE=$(curl -s -X POST http://test-runner:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "smoke",
    "gatewayUrl": "http://staging-gateway:5173",
    "duration": "30s"
  }')

TEST_ID=$(echo $RESPONSE | jq -r '.testId')

# Wait for completion
while true; do
  STATUS=$(curl -s http://test-runner:3007/api/tests/$TEST_ID/status | jq -r '.status')
  if [ "$STATUS" = "completed" ]; then
    EXIT_CODE=$(curl -s http://test-runner:3007/api/tests/$TEST_ID/status | jq -r '.exitCode')
    exit $EXIT_CODE
  fi
  sleep 5
done
```

### Example 2: Scheduled Load Test

```bash
# Run daily load test at 2 AM
# Add to crontab: 0 2 * * * /path/to/load-test.sh

curl -X POST http://test-runner:3007/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "load",
    "serviceUrls": {
      "product": "http://product-service:3002",
      "inventory": "http://inventory-service:3003"
    },
    "stages": [
      { "duration": "5m", "target": 100 },
      { "duration": "10m", "target": 100 },
      { "duration": "5m", "target": 0 }
    ],
    "webhookUrl": "http://monitoring:8080/test-results"
  }'
```

### Example 3: CI/CD Integration

```yaml
# GitHub Actions / GitLab CI
test-services:
  stage: test
  script:
    - |
      RESPONSE=$(curl -X POST http://test-runner:3007/api/tests/run \
        -H "Content-Type: application/json" \
        -d "{
          \"testType\": \"smoke\",
          \"gatewayUrl\": \"$STAGING_GATEWAY_URL\",
          \"auth\": {
            \"username\": \"$CI_TEST_USER\",
            \"password\": \"$CI_TEST_PASSWORD\"
          }
        }")
      
      TEST_ID=$(echo $RESPONSE | jq -r '.testId')
      
      # Poll for completion
      while true; do
        STATUS_JSON=$(curl -s http://test-runner:3007/api/tests/$TEST_ID/status)
        STATUS=$(echo $STATUS_JSON | jq -r '.status')
        
        if [ "$STATUS" = "completed" ]; then
          EXIT_CODE=$(echo $STATUS_JSON | jq -r '.exitCode')
          if [ "$EXIT_CODE" -eq 0 ]; then
            echo "✅ Tests passed"
            exit 0
          else
            echo "❌ Tests failed"
            curl -s http://test-runner:3007/api/tests/$TEST_ID/logs | jq -r '.logs[]'
            exit 1
          fi
        elif [ "$STATUS" = "failed" ]; then
          echo "❌ Test execution failed"
          exit 1
        fi
        
        sleep 5
      done
```

---

## Troubleshooting

### Tests fail with authentication error

**Problem**: `Authentication failed` error

**Solutions**:
- Verify `ASGARDEO_*` environment variables
- Check client credentials are correct
- Ensure username/password are valid
- Verify token URL is accessible

### Gateway unreachable in smoke tests

**Problem**: Connection refused to gateway

**Solutions**:
- Check gateway service is running
- Use `host.docker.internal` in Docker Desktop
- Use service discovery names in Kubernetes
- Verify network connectivity

### Load tests fail to connect to services

**Problem**: Direct service calls timeout

**Solutions**:
- Ensure services are accessible from test runner
- Check service URLs don't include `/api/` prefix
- Verify service ports are correct
- Test connectivity: `curl http://service:port`

---

## Development

### Run in Development Mode

```bash
npm run dev
```

Uses `nodemon` for auto-reload on file changes.

### Project Structure

```
test-runner/
├── src/
│   ├── server.js       # Express REST API
│   ├── auth.js         # Authentication logic
│   ├── k6/
│   │   ├── smoke.js    # Smoke test script
│   │   └── load.js     # Load test script
│   └── public/         # Static files (if any)
├── logs/               # Test execution logs
├── Dockerfile
├── package.json
├── .env.example
├── README.md
└── API_DOCUMENTATION.md
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

[Your License Here]

---

## Support

- 📖 [Full API Documentation](./API_DOCUMENTATION.md)
- 🐛 [Report Issues](https://github.com/yourorg/test-runner/issues)
- 📧 Email: support@example.com

---

## Related Documentation

- [K6 Documentation](https://k6.io/docs/)
- [Asgardeo Documentation](https://wso2.com/asgardeo/docs/)
- [Nginx Gateway Configuration](../gateway/nginx.conf)
