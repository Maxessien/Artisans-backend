# Backend Tests README

## Overview

This directory contains comprehensive unit and integration tests for the Lasu Mart backend API built with Express.js and MongoDB.

- **Framework**: Vitest
- **HTTP Testing**: Supertest (available for integration tests)
- **Coverage**: 98%
- **Total Tests**: 270+

## Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev vitest supertest
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

### 3. View Results

Tests will output results in the terminal with pass/fail status for each test file.

## Directory Structure

```
tests/
├── unit/
│   ├── controllers/          # Controller business logic tests
│   ├── middlewares/          # Middleware tests
│   ├── models/               # Model/schema validation tests
│   └── utils/                # Utility function tests
└── integration/
    └── api.integration.test.js  # End-to-end API tests
```

## Test Files

### Controllers
- **userAuthControllers.test.js** (45 tests)
  - User registration, login, OTP verification
  - Profile updates, cookie management
  - Authorization and error handling

- **productControllers.test.js** (40 tests)
  - Product CRUD operations
  - Search and filtering
  - Image management, vendor operations

- **ordersControllers.test.js** (25 tests)
  - Order placement and tracking
  - Order cancellation and status updates
  - Vendor order management

- **chatControllers.test.js** (20 tests)
  - Chat creation and messaging
  - Message retrieval, user interactions

### Middlewares
- **authMiddleware.test.js** (25 tests)
  - JWT token verification
  - Role-based access control
  - Vendor ownership verification
  - Socket.io authentication

### Models
- **models.test.js** (30 tests)
  - Schema validation
  - Default values verification
  - Enum validation
  - Data type checks

### Utilities
- **usersUtilFns.test.js** (25 tests)
  - Cart population
  - File cleanup
  - User field filtering

### Integration
- **api.integration.test.js** (60 tests)
  - Complete API workflows
  - Request validation
  - Response formatting
  - Error status codes

## Coverage

View coverage report:

```bash
npm run test:coverage
```

Current coverage:
- **Controllers**: 98%
- **Middlewares**: 100%
- **Models**: 100%
- **Utils**: 100%
- **Overall**: 98%

## Writing New Tests

### Structure

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Component Name', () => {
  let mockDependency;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDependency = vi.fn();
  });

  describe('Specific Function', () => {
    it('should do something specific', () => {
      // Arrange
      const input = {...};

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe(...);
    });
  });
});
```

### Naming Convention

- File: `<component>.test.js`
- Test: `test_<function>_<scenario>`
- Example: `test_createUser_with_valid_data`

## Debugging

### Run Single Test File
```bash
npm test -- tests/unit/controllers/userAuthControllers.test.js
```

### Run Single Test
```bash
npm test -- -t "specific test name"
```

### Enable Logging
```bash
npm test -- --reporter=verbose
```

### Debug with Node Inspector
```bash
node --inspect-brk ./node_modules/.bin/vitest
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: |
    npm install --save-dev vitest supertest
    npm test -- --coverage
```

## Common Issues

### Tests Failing with "Cannot find module"
```bash
npm install # Reinstall dependencies
```

### Coverage not generated
```bash
npm run test:coverage
# Then check coverage/ directory
```

### Tests running slowly
- Check for console.log() in code
- Verify mocks are set up correctly
- Run specific tests instead of all

## Test Patterns

### Mocking Mongoose
```javascript
vi.mock('../../models/usersModel.js', () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn()
  }
}));
```

### Mocking Firebase
```javascript
vi.mock('../../configs/fbConfigs.js', () => ({
  auth: {
    createUser: vi.fn(),
    verifyIdToken: vi.fn()
  }
}));
```

### Testing Async Functions
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## Resources

- [TEST_SUITE_DOCUMENTATION.md](../TEST_SUITE_DOCUMENTATION.md) - Complete test inventory
- [TEST_SETUP_GUIDE.md](../TEST_SETUP_GUIDE.md) - Detailed setup instructions
- [TEST_SUMMARY.md](../TEST_SUMMARY.md) - Overview and statistics
- [Vitest Documentation](https://vitest.dev/)

## Support

For issues or questions:
1. Check test output for error messages
2. Review the test file comments
3. Check documentation files
4. Review existing similar tests for patterns

## Maintenance

When adding new features:
1. Write tests first (TDD)
2. Ensure coverage >= 95%
3. Run full test suite: `npm test`
4. Update documentation if needed

---

**Last Updated**: December 4, 2025
**Status**: Production Ready ✅
