# Utility Scripts

This folder contains utility scripts for maintenance, setup, and operational tasks.

## Available Scripts

### Database Management

- **`reset-passwords.js`** - Node.js script to reset user passwords
- **`reset-passwords.sql`** - SQL script for password reset operations

## Running Scripts

### Node.js Scripts

```bash
cd backend/scripts
node reset-passwords.js
```

### SQL Scripts

```bash
# Using psql
psql -U postgres -d ims_db -f reset-passwords.sql

# Using docker exec
docker exec -i ims-postgres psql -U postgres -d ims_db < reset-passwords.sql
```

## Script Categories

```
scripts/
├── database/           # Database-related scripts (planned)
├── deployment/         # Deployment automation (planned)
├── maintenance/        # Maintenance utilities (planned)
├── reset-passwords.js  # Password reset utility
├── reset-passwords.sql # Password reset SQL
└── README.md          # This file
```

## Future Script Organization

As the project grows, organize scripts into subdirectories:

```
scripts/
├── database/
│   ├── backup.sh
│   ├── restore.sh
│   ├── seed-data.js
│   └── reset-passwords.js
├── deployment/
│   ├── deploy-staging.sh
│   ├── deploy-production.sh
│   └── health-check.sh
├── maintenance/
│   ├── cleanup-logs.sh
│   ├── optimize-db.sql
│   └── generate-reports.js
└── migration/
    ├── run-migrations.sh
    └── rollback-migration.sh
```

## Script Documentation Template

When creating new scripts, include a header:

```javascript
/**
 * Script Name: [name]
 * Purpose: [what it does]
 * Usage: node [script-name].js [args]
 * Prerequisites: [what's needed]
 * Author: [name]
 * Date: [YYYY-MM-DD]
 */
```

For shell scripts:

```bash
#!/bin/bash
# Script Name: [name]
# Purpose: [what it does]
# Usage: ./[script-name].sh [args]
# Prerequisites: [what's needed]
# Author: [name]
# Date: [YYYY-MM-DD]
```

## Best Practices

### Script Development

- ✅ Use clear, descriptive names
- ✅ Include error handling
- ✅ Add usage instructions in comments
- ✅ Log important actions
- ✅ Make scripts idempotent when possible
- ✅ Include rollback/cleanup logic
- ✅ Test in non-production first

### Security

- ⚠️ Never hardcode passwords or secrets
- ⚠️ Use environment variables for sensitive data
- ⚠️ Validate all inputs
- ⚠️ Log actions for audit trails
- ⚠️ Restrict file permissions appropriately

### Environment Variables

Scripts should read configuration from environment:

```javascript
// Node.js example
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
```

```bash
# Shell script example
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
```

## Common Script Patterns

### Node.js Database Script

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ims_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function main() {
  try {
    // Your logic here
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
```

### Shell Script Template

```bash
#!/bin/bash
set -e  # Exit on error

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Your logic here

echo "✅ Script completed successfully"
```

## NPM Script Integration

Add commonly used scripts to `package.json`:

```json
{
  "scripts": {
    "script:reset-passwords": "node scripts/reset-passwords.js",
    "script:backup-db": "bash scripts/backup.sh",
    "script:seed-data": "node scripts/seed-data.js"
  }
}
```

Then run with:

```bash
npm run script:reset-passwords
```

## Contributing

When adding new scripts:

1. Choose appropriate category/subdirectory
2. Follow naming conventions: `verb-noun.ext`
3. Include documentation header
4. Add usage examples
5. Test thoroughly before committing
6. Update this README
