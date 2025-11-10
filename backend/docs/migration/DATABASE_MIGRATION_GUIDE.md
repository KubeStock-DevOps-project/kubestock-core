# Database Migration Guide

## Overview

This project uses **node-pg-migrate** for managing database schema changes in a version-controlled, reversible manner.

## Why Use Migrations?

✅ **Version Control**: Track all database schema changes in code  
✅ **Reproducibility**: Apply same changes across dev, staging, production  
✅ **Rollback Capability**: Undo changes if needed  
✅ **Team Collaboration**: Avoid schema conflicts in team environments  
✅ **Audit Trail**: Complete history of all database changes  

---

## Setup

### Installation

Already installed in this project:
```bash
npm install --save-dev node-pg-migrate
```

### Configuration

Database connection is configured in `database.json`:

```json
{
  "dev": {
    "driver": "pg",
    "host": "localhost",
    "port": 5432,
    "database": "ims_db",
    "user": "postgres",
    "password": "postgres"
  }
}
```

---

## Migration Commands

### 1. Run All Pending Migrations

```bash
cd backend
npm run migrate:up
```

This applies all migrations that haven't been run yet. Safe to run multiple times.

### 2. Rollback Last Migration

```bash
cd backend
npm run migrate:down
```

Reverts the most recently applied migration. Use with caution in production!

### 3. Create New Migration

```bash
cd backend
npm run migrate:create -- my-migration-name
```

Creates a new timestamped migration file in `backend/migrations/`.

### 4. Check Migration Status

```bash
cd backend
npm run migrate -- list
```

Shows which migrations have been applied and which are pending.

---

## Migration Files

### Current Migrations

1. **`1762794719353_initial-schema.js`** - Base schema for all tables
2. **`1762794819206_inventory-business-logic.js`** - Stock alerts and reorder suggestions
3. **`1762794871520_order-status-history.js`** - Order status audit trail
4. **`1762794885930_product-pricing-and-lifecycle.js`** - Pricing rules and product lifecycle

### File Structure

Each migration file has two functions:

```javascript
export const up = (pgm) => {
  // Changes to apply (create tables, add columns, etc.)
};

export const down = (pgm) => {
  // How to undo the changes (rollback)
};
```

---

## Creating New Migrations

### Example: Adding a New Column

```bash
npm run migrate:create -- add-user-phone-number
```

Edit the generated file:

```javascript
export const up = (pgm) => {
  pgm.addColumn('users', {
    phone_number: { type: 'varchar(20)' }
  });
};

export const down = (pgm) => {
  pgm.dropColumn('users', 'phone_number');
};
```

### Example: Creating a New Table

```javascript
export const up = (pgm) => {
  pgm.createTable('customer_reviews', {
    id: 'id', // Auto-creates SERIAL PRIMARY KEY
    product_id: { 
      type: 'integer', 
      notNull: true,
      references: 'products',
      onDelete: 'CASCADE'
    },
    rating: { 
      type: 'integer', 
      notNull: true,
      check: 'rating >= 1 AND rating <= 5'
    },
    comment: 'text',
    created_at: { 
      type: 'timestamp', 
      notNull: true, 
      default: pgm.func('current_timestamp') 
    }
  });

  pgm.createIndex('customer_reviews', 'product_id');
};

export const down = (pgm) => {
  pgm.dropTable('customer_reviews', { ifExists: true, cascade: true });
};
```

---

## Best Practices

### ✅ DO:

1. **Always test migrations locally first** before applying to production
2. **Write both `up` and `down` functions** - migrations should be reversible
3. **Create separate migrations for different features** - easier to track and rollback
4. **Add indexes for foreign keys and frequently queried columns**
5. **Use meaningful migration names** - describe what the migration does
6. **Review generated SQL** before applying to production
7. **Backup database before running migrations in production**

### ❌ DON'T:

1. **Never edit applied migrations** - create a new migration instead
2. **Don't delete old migration files** - they're part of your schema history
3. **Avoid data migrations in schema migrations** - separate concerns
4. **Don't use raw SQL without `pgm.sql()`** - use migration builder methods when possible

---

## Production Deployment Workflow

### Step 1: Development

```bash
# Create and test migration locally
npm run migrate:create -- add-feature-name
# Edit migration file
npm run migrate:up
# Test the changes
```

### Step 2: Version Control

```bash
git add backend/migrations/
git commit -m "Add migration: feature-name"
git push
```

### Step 3: Staging Environment

```bash
# On staging server
cd backend
npm run migrate:up
# Run tests to verify
```

### Step 4: Production Environment

```bash
# Backup database first!
pg_dump ims_db > backup_$(date +%Y%m%d).sql

# Apply migrations
cd backend
npm run migrate:up

# Verify
npm run migrate -- list
```

---

## Docker Integration

### Current Setup

The `docker-compose.yml` currently uses `init.sql` for initial setup. For a migration-based approach:

### Option 1: Manual Migration After Container Start

```bash
# Start containers
docker-compose up -d

# Run migrations
cd backend
npm run migrate:up
```

### Option 2: Add Migration Runner Container (Recommended for Production)

Add to `docker-compose.yml`:

```yaml
migration-runner:
  build:
    context: .
    dockerfile: Dockerfile.migrations
  depends_on:
    postgres:
      condition: service_healthy
  environment:
    DATABASE_URL: postgres://postgres:postgres@postgres:5432/ims_db
  command: npm run migrate:up
  networks:
    - ims-network
```

Create `backend/Dockerfile.migrations`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "migrate:up"]
```

---

## Troubleshooting

### Migration Failed Midway

```bash
# Check status
npm run migrate -- list

# If locked, unlock
psql -d ims_db -c "DELETE FROM pgmigrations WHERE name = 'failed-migration-name';"

# Fix the migration file and retry
npm run migrate:up
```

### Wrong Migration Applied

```bash
# Rollback one step
npm run migrate:down

# Fix the issue and reapply
npm run migrate:up
```

### Database Out of Sync

```bash
# Check which migrations are applied
npm run migrate -- list

# If migrations table is corrupted, recreate it
psql -d ims_db -c "DROP TABLE IF EXISTS pgmigrations CASCADE;"
npm run migrate:up
```

---

## Migration Tracking

node-pg-migrate creates a `pgmigrations` table automatically:

```sql
SELECT * FROM pgmigrations;
```

This table tracks which migrations have been applied and when.

---

## References

- **node-pg-migrate Documentation**: https://salsita.github.io/node-pg-migrate/
- **PostgreSQL Data Types**: https://www.postgresql.org/docs/current/datatype.html
- **Migration Best Practices**: https://www.brunton-spall.co.uk/post/2014/05/06/database-migrations-done-right/

---

## Quick Reference

```bash
# Create new migration
npm run migrate:create -- migration-name

# Apply all pending
npm run migrate:up

# Rollback last
npm run migrate:down

# Check status
npm run migrate -- list

# Apply specific number of migrations
npm run migrate -- up 2

# Rollback specific number
npm run migrate -- down 2
```

---

## Team Workflow

1. **Developer A** creates migration: `npm run migrate:create -- add-feature`
2. **Developer A** tests locally: `npm run migrate:up`
3. **Developer A** commits: `git commit migrations/`
4. **Developer B** pulls changes: `git pull`
5. **Developer B** applies migrations: `npm run migrate:up`
6. **CI/CD** automatically applies migrations in staging/production

---

**Note**: All future database schema changes MUST be done through migrations, not by manually editing `init.sql` or running SQL directly.
