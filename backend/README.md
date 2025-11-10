# Inventory & Stock Management System - Microservices Backend

## 🏗️ Architecture Overview

This is a production-ready microservices-based backend for an Inventory and Stock Management System built with:
- **Node.js** (Express.js)
- **PostgreSQL** (separate schemas for each service)
- **Docker** & **Docker Compose**
- **REST APIs** for inter-service communication
- **Database Migrations** with node-pg-migrate

### Microservices

1. **User Service** (Port 3001) - Authentication, Authorization, User Management
2. **Product Catalog Service** (Port 3002) - Product & Category Management
3. **Inventory Service** (Port 3003) - Stock Tracking & Management
4. **Supplier & Procurement Service** (Port 3004) - Supplier & Purchase Order Management
5. **Order Management Service** (Port 3005) - Sales Order Processing

## 📁 Project Structure

```
backend/
├── database/              # Database initialization scripts
├── migrations/            # Database migration files (node-pg-migrate)
├── services/             # Microservices
│   ├── user-service/
│   ├── product-catalog-service/
│   ├── inventory-service/
│   ├── supplier-service/
│   └── order-service/
├── docs/                 # Documentation
│   ├── api/             # API documentation
│   ├── migration/       # Migration guides
│   ├── DEVOPS_INTEGRATION.md
│   ├── PRODUCTION_CHECKLIST.md
│   └── PROJECT_SUMMARY.md
├── scripts/             # Utility scripts
│   ├── reset-passwords.js
│   └── reset-passwords.sql
├── tests/               # Test scripts
│   ├── crud-tests.ps1
│   └── test-crud.ps1
├── docker-compose.yml   # Docker orchestration
├── database.json        # Migration configuration
├── package.json         # NPM scripts & dependencies
├── README.md           # This file
└── QUICKSTART.md       # Quick start guide
```

## 📋 Prerequisites

- **Node.js** >= 18.x
- **Docker** >= 20.x
- **Docker Compose** >= 2.x
- **PostgreSQL** >= 15.x (if running locally without Docker)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd backend
cp .env.example .env
```

### 2. Start All Services with Docker Compose

```bash
docker-compose up --build
```

This will:
- Create a PostgreSQL database container
- Initialize all database schemas
- Start all 5 microservices
- Set up networking between services

### 3. Verify Services

Check health endpoints:
```bash
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Catalog Service
curl http://localhost:3003/health  # Inventory Service
curl http://localhost:3004/health  # Supplier Service
curl http://localhost:3005/health  # Order Service
```

### 4. Stop Services

```bash
docker-compose down
```

To remove volumes as well:
```bash
docker-compose down -v
```

## 🔧 Development Setup (Without Docker)

### 1. Install Dependencies

```bash
# Install dependencies for each service
cd services/user-service && npm install && cd ../..
cd services/product-catalog-service && npm install && cd ../..
cd services/inventory-service && npm install && cd ../..
cd services/supplier-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
```

### 2. Setup PostgreSQL Database

```bash
# Create databases
psql -U postgres -f database/init.sql
```

### 3. Configure Environment Variables

Create `.env` file in each service directory based on `.env.example`

### 4. Start Each Service

```bash
# Terminal 1 - User Service
cd services/user-service && npm run dev

# Terminal 2 - Product Catalog Service
cd services/product-catalog-service && npm run dev

# Terminal 3 - Inventory Service
cd services/inventory-service && npm run dev

# Terminal 4 - Supplier Service
cd services/supplier-service && npm run dev

# Terminal 5 - Order Service
cd services/order-service && npm run dev
```

## 📚 API Documentation

### User Service (Port 3001)

#### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/profile` - Get user profile (requires JWT)
- `PUT /api/auth/profile` - Update profile (requires JWT)
- `PUT /api/auth/change-password` - Change password (requires JWT)

#### User Management (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Example - Register User:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "warehouse_staff"
  }'
```

**Example - Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Product Catalog Service (Port 3002)

#### Category Endpoints
- `POST /api/categories` - Create category
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### Product Endpoints
- `POST /api/products` - Create product
- `GET /api/products` - Get all products (supports filtering)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/sku/:sku` - Get product by SKU
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/batch` - Get multiple products by IDs

**Example - Create Product:**
```bash
curl -X POST http://localhost:3002/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Laptop",
    "description": "High-performance laptop",
    "category_id": 1,
    "size": "15 inch",
    "color": "Silver",
    "unit_price": 999.99,
    "attributes": {"brand": "TechCorp", "warranty": "2 years"}
  }'
```

### Inventory Service (Port 3003)

#### Inventory Endpoints
- `POST /api/inventory` - Create inventory for product
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/product/:productId` - Get inventory by product
- `PUT /api/inventory/product/:productId` - Update inventory settings

#### Stock Operations
- `POST /api/inventory/adjust` - Adjust stock (in/out/damaged/expired)
- `POST /api/inventory/reserve` - Reserve stock for orders
- `POST /api/inventory/release` - Release reserved stock
- `GET /api/inventory/movements` - Get stock movement history

**Example - Adjust Stock:**
```bash
curl -X POST http://localhost:3003/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "sku": "PROD-001",
    "movement_type": "in",
    "quantity": 100,
    "notes": "New stock arrival"
  }'
```

### Supplier & Procurement Service (Port 3004)

#### Supplier Endpoints
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

#### Purchase Order Endpoints
- `POST /api/purchase-orders` - Create purchase order
- `GET /api/purchase-orders` - Get all purchase orders
- `GET /api/purchase-orders/:id` - Get PO by ID
- `PUT /api/purchase-orders/:id` - Update PO
- `PUT /api/purchase-orders/:id/receive` - Receive PO items
- `DELETE /api/purchase-orders/:id` - Delete PO

### Order Management Service (Port 3005)

#### Order Endpoints
- `POST /api/orders` - Create order (deducts inventory)
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order (releases inventory)

## 🔐 Authentication & Authorization

### Roles
- **admin**: Full access to all resources
- **warehouse_staff**: Inventory and order management
- **supplier**: Limited access to purchase orders

### JWT Token Usage

After login, include the JWT token in subsequent requests:

```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐳 Docker & Kubernetes Ready

### Docker Build Individual Service

```bash
cd services/user-service
docker build -t user-service:latest .
```

### Kubernetes Deployment

Each service includes:
- Health check endpoints (`/health`)
- Liveness and readiness probe support
- Environment-based configuration
- Logging with Winston
- Error handling middleware

### Example Kubernetes Deployment (user-service):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PORT
          value: "5432"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 📊 Monitoring & Observability

### Prometheus Metrics (Future Enhancement)

Add `prom-client` to expose metrics:
```javascript
const promClient = require('prom-client');
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
```

### OpenSearch Logging (Future Enhancement)

Configure Winston to send logs to OpenSearch:
```javascript
const { OpenSearch } = require('@opensearch-project/opensearch');
```

## 🔄 CI/CD Pipeline Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker Images
        run: |
          docker build -t user-service:${{ github.sha }} ./services/user-service
          docker build -t product-catalog-service:${{ github.sha }} ./services/product-catalog-service
          # ... other services
      
      - name: Push to Registry
        run: |
          docker push user-service:${{ github.sha }}
          # ... other services
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/user-service user-service=user-service:${{ github.sha }}
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Validation**: Joi
- **Logging**: Winston
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **HTTP Client**: Axios
- **Containerization**: Docker, Docker Compose
- **Migrations**: node-pg-migrate

## 🧪 Testing

```bash
# Run test scripts
cd tests
.\crud-tests.ps1

# Or run specific service tests
cd services/user-service
npm test
```

For more testing information, see the [tests folder](tests/README.md).

## 🗄️ Database Migrations

This project uses **node-pg-migrate** for database schema version control.

### Common Migration Commands

```bash
# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create -- migration-name
```

**📖 Full Documentation**: See [Database Migration Guide](docs/migration/DATABASE_MIGRATION_GUIDE.md)

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use strong, random secrets (min 32 characters)
3. **Password Hashing**: bcrypt with salt rounds = 10
4. **Rate Limiting**: Implemented on all services
5. **Helmet**: Security headers enabled
6. **Input Validation**: Joi validation on all endpoints
7. **SQL Injection**: Parameterized queries with pg

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
```

### Service Not Starting
```bash
# Check service logs
docker-compose logs user-service

# Restart specific service
docker-compose restart user-service
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml or kill process
lsof -ti:3001 | xargs kill -9  # macOS/Linux
```

## � Additional Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Fast setup for new developers
- **[API Documentation](docs/api/)** - Detailed API endpoints and testing guides
- **[Migration Guide](docs/migration/DATABASE_MIGRATION_GUIDE.md)** - Database schema management
- **[DevOps Integration](docs/DEVOPS_INTEGRATION.md)** - Docker, CI/CD, deployment
- **[Production Checklist](docs/PRODUCTION_CHECKLIST.md)** - Pre-deployment verification
- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Architecture and system overview

## 🗂️ Folder Organization

- **`/database`** - Database initialization and schema files
- **`/migrations`** - Version-controlled database migrations
- **`/services`** - All microservices source code
- **`/docs`** - Comprehensive project documentation
- **`/scripts`** - Utility scripts for maintenance and operations
- **`/tests`** - Test scripts for CRUD and integration testing

## �📝 License

ISC

## 👥 Contributors

Your Team

## 📧 Support

For issues and questions, please open an issue in the repository.
