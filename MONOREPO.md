# KubeStock Monorepo

> Inventory & Stock Management System - Microservices Monorepo

## 🏗️ Monorepo Structure

```
kubestock-monorepo/
├── services/              # Backend microservices
│   ├── ms-product/       # Product Catalog Service (Port 3002)
│   ├── ms-inventory/     # Inventory Management Service (Port 3003)
│   ├── ms-supplier/      # Supplier Service (Port 3004)
│   ├── ms-order-management/ # Order Management Service (Port 3005)
│   └── ms-identity/      # Identity/SCIM2 Service (Port 3006)
├── apps/
│   └── web/              # Frontend React SPA (Port 3000)
├── packages/             # Shared packages
│   ├── shared-config/    # ESLint, Jest configs
│   └── shared-types/     # Shared TypeScript types
├── infrastructure/       # Terraform, Ansible (submodule)
├── gitops/              # ArgoCD manifests (submodule)
├── gateway/             # NGINX API Gateway config
├── database/            # PostgreSQL initialization scripts
└── docker-compose.yml   # Local development orchestration

```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm 9+

### Installation

```bash
# Install all dependencies (uses npm workspaces + Turborepo)
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your secrets (Asgardeo, database credentials)

# Start all services with Docker
npm run docker:up

# Or run services in development mode (requires PostgreSQL)
npm run dev
```

### Available Commands

```bash
# Development
npm run dev              # Run all services in watch mode (parallel)
npm run build            # Build all services
npm run test             # Run all tests across services
npm run lint             # Lint all services

# Docker
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View logs

# Database
npm run migrate:up       # Run migrations for all services
npm run migrate:down     # Rollback migrations

# Maintenance
npm run clean            # Clean all build artifacts and node_modules
```

## 📦 Workspaces

This monorepo uses **npm workspaces** with **Turborepo** for build orchestration.

### Services
Each service is an independent Node.js application with:
- Express.js REST API
- PostgreSQL database (separate schema per service)
- Jest tests with coverage
- Prometheus metrics
- Docker build support

### Frontend (apps/web)
- React 19 + Vite
- Tailwind CSS
- Asgardeo authentication
- Zustand state management

### Shared Packages
- `@kubestock/shared-config` - ESLint, Jest configurations
- `@kubestock/shared-types` - Common TypeScript types

## 🔧 Development Workflow

### Working on a Service

```bash
# Navigate to service
cd services/ms-product

# Install dependencies (or use root npm install)
npm install

# Run tests
npm test

# Run in dev mode
npm run dev
```

### Adding Dependencies

```bash
# Add to specific service
npm install <package> --workspace=services/ms-product

# Add to all services
npm install <package> --workspaces

# Add to root (dev tools)
npm install <package> --save-dev
```

### Running Tests

```bash
# All tests
npm test

# Specific service
npm test --workspace=services/ms-inventory

# With coverage
turbo run test --filter=ms-product
```

## 🐳 Docker Development

The `docker-compose.yml` orchestrates all services locally:

- **API Gateway (NGINX)**: http://localhost:5173
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Services**: Ports 3002-3006

Services use `host.docker.internal` routing to allow debugging individual services outside Docker.

## 📁 Migration from Multi-Repo

This monorepo was migrated from a multi-repository structure with Git submodules.

**Previous structure:**
- 8 separate repositories (1 main + 7 submodules)
- Git submodules in `modules/` directory

**New structure:**
- Single repository with workspaces
- Services in `services/`
- Frontend in `apps/web`
- Infrastructure/GitOps remain as submodules (optional)

**Submodule repositories preserved:**
- `infrastructure/` - Terraform, Ansible, Kubespray
- `gitops/` - ArgoCD manifests

## 🔄 CI/CD

GitHub Actions workflows (TODO - being migrated):
- Change detection per service
- Build & push to AWS ECR
- Update GitOps repository
- Deploy to staging/production

## 📚 Documentation

- [Architecture & Tech Stack](docs/ARCHITECTURE_AND_TECHNOLOGY_STACK.md)
- [Authentication System](docs/AUTHENTICATION_AND_USER_SYSTEM.md)
- [Local Development](LOCAL_DEVELOPMENT.md)
- [GitOps & CI/CD](docs/GITOPS_CICD_INTEGRATION.md)

## 🛠️ Tech Stack

**Backend:**
- Node.js 18 + Express.js
- PostgreSQL 15
- Jest testing
- Prometheus metrics
- JWT authentication

**Frontend:**
- React 19 + Vite
- Tailwind CSS 4
- React Router 6
- Asgardeo Auth

**Infrastructure:**
- Docker + Docker Compose
- Kubernetes (EKS)
- ArgoCD (GitOps)
- Terraform + Ansible

**Monorepo:**
- npm workspaces
- Turborepo
- Shared packages

## 📄 License

MIT

## 🤝 Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch
4. Make changes and test: `npm test`
5. Submit a pull request

---

**Note:** This monorepo uses Turborepo for efficient builds and caching. Run `turbo --help` for advanced usage.
