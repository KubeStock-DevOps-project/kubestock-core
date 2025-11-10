# Database Migration Setup - Summary

## ✅ What's Been Implemented

We've successfully set up **node-pg-migrate** as our database migration tool. Here's what's now in place:

---

## 📦 Installed Packages

```json
{
  "devDependencies": {
    "node-pg-migrate": "^8.0.3"
  }
}
```

---

## 🛠️ NPM Scripts Added

```json
{
  "scripts": {
    "migrate": "node-pg-migrate",
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "migrate:create": "node-pg-migrate create"
  }
}
```

---

## 📁 Migration Files Created

### 1. `1762794719353_initial-schema.js`
**Purpose**: Complete base schema for all microservices

**Creates**:
- ✅ Users table (User Service)
- ✅ Categories and Products tables (Product Catalog)
- ✅ Inventory and Stock Movements tables (Inventory)
- ✅ Suppliers, Purchase Orders, PO Items (Supplier)
- ✅ Orders and Order Items tables (Order)

**Features**:
- All primary keys, foreign keys, constraints
- All indexes for performance
- Generated columns (available_quantity, total_price)
- Default admin user
- Sample categories

---

### 2. `1762794819206_inventory-business-logic.js`
**Purpose**: Advanced inventory management features

**Creates**:
- ✅ `stock_alerts` table - Low stock/out of stock/overstock alerts
- ✅ `reorder_suggestions` table - Automatic reorder recommendations

**Features**:
- Unique constraint on (product_id, alert_type)
- Indexes on product_id and status
- Status tracking (active, resolved, ignored)

---

### 3. `1762794871520_order-status-history.js`
**Purpose**: Order audit trail

**Creates**:
- ✅ `order_status_history` table - Tracks all order status changes

**Features**:
- Links to orders via foreign key
- Records who changed status and when
- Optional notes field
- Indexed for fast queries

---

### 4. `1762794885930_product-pricing-and-lifecycle.js`
**Purpose**: Dynamic pricing and product approval workflow

**Creates**:
- ✅ Adds lifecycle columns to products table (state, approvals)
- ✅ `pricing_rules` table - Bulk, promotion, category-based pricing
- ✅ `product_lifecycle_history` table - Tracks state transitions

**Features**:
- Support for bulk discounts, promotions, customer tiers
- Date-based pricing rules (valid_from, valid_until)
- Complete audit trail of product approvals

---

## 📋 Configuration Files

### `database.json`
```json
{
  "dev": {
    "driver": "pg",
    "host": "localhost",
    "port": 5432,
    "database": "ims_db",
    "user": "postgres",
    "password": "postgres",
    "schema": "public",
    "migrationsTable": "pgmigrations"
  }
}
```

---

## 📚 Documentation Created

### `DATABASE_MIGRATION_GUIDE.md`
Complete guide covering:
- ✅ Why use migrations
- ✅ Setup and configuration
- ✅ All migration commands
- ✅ Creating new migrations with examples
- ✅ Best practices (DOs and DON'Ts)
- ✅ Production deployment workflow
- ✅ Docker integration options
- ✅ Troubleshooting guide
- ✅ Team collaboration workflow

---

## 🔄 Migration vs Old Approach

### ❌ Old Approach (Not Recommended)
```
backend/
  database/
    init.sql                    # Manual SQL, runs once
    migrations/
      002_*.sql                 # Manual SQL files
      003_*.sql                 # No version tracking
      004_*.sql                 # No rollback capability
```

### ✅ New Approach (Production-Grade)
```
backend/
  migrations/
    1762794719353_initial-schema.js           # Versioned, tracked
    1762794819206_inventory-business-logic.js # Can rollback
    1762794871520_order-status-history.js     # Team-friendly
    1762794885930_product-pricing-...js       # Production-ready
  database.json                               # Config
  DATABASE_MIGRATION_GUIDE.md                 # Documentation
```

---

## 🚀 How to Use

### First Time Setup (New Database)

```bash
cd backend
npm run migrate:up
```

This will:
1. Create `pgmigrations` tracking table
2. Run all 4 migrations in order
3. Set up complete database schema
4. Insert default data (admin user, sample categories)

### Check Status

```bash
npm run migrate -- list
```

Output:
```
✓ 1762794719353_initial-schema
✓ 1762794819206_inventory-business-logic
✓ 1762794871520_order-status-history
✓ 1762794885930_product-pricing-and-lifecycle
```

### Create New Migration

```bash
npm run migrate:create -- add-customer-reviews
```

Creates: `backend/migrations/[timestamp]_add-customer-reviews.js`

### Rollback Last Migration

```bash
npm run migrate:down
```

---

## 🎯 Key Benefits

### 1. **Version Control** ✅
All schema changes are in Git, tracked with your code

### 2. **Reproducibility** ✅
Same schema on dev, staging, production

### 3. **Rollback** ✅
Every migration has a `down()` function to undo changes

### 4. **Team Collaboration** ✅
No more schema conflicts or manual SQL sharing

### 5. **Audit Trail** ✅
Complete history of when/why schema changed

### 6. **Automated Testing** ✅
CI/CD can automatically apply migrations

---

## 🐳 Docker Integration Options

### Option 1: Manual (Current)
```bash
docker-compose up -d      # Start services
cd backend
npm run migrate:up        # Apply migrations manually
```

### Option 2: Automated (Recommended for Production)
Add migration runner container to `docker-compose.yml`:

```yaml
migration-runner:
  image: node:18-alpine
  working_dir: /app
  volumes:
    - ./:/app
  depends_on:
    postgres:
      condition: service_healthy
  command: sh -c "npm install && npm run migrate:up"
  networks:
    - ims-network
```

---

## 📊 Migration Tracking

node-pg-migrate automatically creates:

**Table**: `pgmigrations`

| Column | Type | Purpose |
|--------|------|---------|
| id | SERIAL | Auto-increment |
| name | VARCHAR | Migration filename |
| run_on | TIMESTAMP | When applied |

Query to check:
```sql
SELECT * FROM pgmigrations ORDER BY run_on DESC;
```

---

## 🔐 Production Workflow

1. **Developer** creates migration locally
2. **Test** migration on local database
3. **Commit** to version control
4. **CI/CD** runs tests in staging
5. **Backup** production database
6. **Apply** migrations to production
7. **Verify** with `npm run migrate -- list`

---

## 🎓 Learning Resources

- **Official Docs**: https://salsita.github.io/node-pg-migrate/
- **API Reference**: https://salsita.github.io/node-pg-migrate/#/api
- **Examples**: See `backend/migrations/*.js`

---

## ⚠️ Important Notes

### Migration Files are Immutable
**Never edit a migration that's been applied** - create a new migration instead

### Always Write Down Functions
Every migration must be reversible for production safety

### Test Before Production
Always test migrations on staging environment first

### Backup Before Migration
Always backup production database before applying new migrations

---

## 🎉 Summary

You now have a **production-grade database migration system** that:

✅ Replaces manual SQL scripts  
✅ Provides version control for schema  
✅ Enables safe rollbacks  
✅ Supports team collaboration  
✅ Works with Docker  
✅ Has complete documentation  

**All future schema changes should go through migrations!**

---

## 📞 Quick Commands Cheat Sheet

```bash
# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create -- my-feature

# Check migration status
npm run migrate -- list

# See help
npm run migrate -- --help
```

---

**Next Steps**: See `DATABASE_MIGRATION_GUIDE.md` for detailed usage instructions and examples.
