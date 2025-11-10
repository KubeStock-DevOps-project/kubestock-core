# Test Scripts

This folder contains all testing-related scripts for the backend services.

## Available Tests

### CRUD Tests

- **`crud-tests.ps1`** - PowerShell script for testing CRUD operations
- **`test-crud.ps1`** - Additional CRUD testing script

## Running Tests

### PowerShell Tests

```powershell
cd backend/tests
.\crud-tests.ps1
```

or

```powershell
cd backend/tests
.\test-crud.ps1
```

## Test Organization

```
tests/
├── crud-tests.ps1       # CRUD operation tests
├── test-crud.ps1        # Alternative CRUD tests
└── README.md            # This file
```

## Future Test Categories

Consider organizing tests into subdirectories as the test suite grows:

```
tests/
├── api/                 # API endpoint tests
├── integration/         # Integration tests
├── unit/               # Unit tests
├── performance/        # Load and performance tests
└── e2e/                # End-to-end tests
```

## Test Prerequisites

Before running tests:

1. **Services Running**: Ensure all Docker services are up
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Environment Variables**: Check `.env` file is configured

3. **Database**: Verify database is initialized and accessible

## Writing New Tests

When adding new test scripts:

1. Use descriptive filenames: `test-[feature].ps1` or `test-[feature].sh`
2. Include error handling and cleanup
3. Add documentation comments at the top of the file
4. Update this README with the new test information

## Test Guidelines

- ✅ Test should be idempotent (can run multiple times)
- ✅ Clean up test data after execution
- ✅ Include both positive and negative test cases
- ✅ Log clear success/failure messages
- ✅ Return appropriate exit codes

## Integration with CI/CD

These test scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run CRUD Tests
  run: |
    cd backend/tests
    pwsh ./crud-tests.ps1
```

## Contributing

When contributing test scripts:

1. Follow existing naming conventions
2. Include proper error handling
3. Document expected behavior
4. Add examples of usage
5. Update this README
