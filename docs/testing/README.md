# Testing Guide

Testing documentation for the Emma Forms project.

## Quick Start

```bash
# Run all automated tests
yarn test

# Run manual test server
yarn test:manual
```

## Documentation

- **[Automated Testing](./01-automated-testing.md)** - Unit and integration tests with Vitest
- **[Manual Testing](./02-manual-testing.md)** - Interactive browser testing

## Test Coverage

**Current Status:**

- ✅ Form Renderer: 19 tests passing
- ✅ API Worker: 1 test passing
- 🎯 Target: 80%+ code coverage

View coverage report:

```bash
yarn workspace @emma/form-renderer test --coverage
```

## CI/CD

All tests run automatically on:

- Every push to any branch
- Every pull request
- Main branch commits

See `.github/workflows/lint-test.yaml` for configuration.

## Manual Testing

The test server provides 5 interactive scenarios with visual checklists:

1. Contact Form - All field types
2. Newsletter - Simple validation
3. Survey - Complex interactions
4. Validation - Error handling
5. Accessibility - A11y compliance

Start the server:

```bash
yarn test:manual
# Opens http://localhost:3000
```

## Troubleshooting

**Tests not running?**

```bash
yarn build  # Build dependencies first
yarn test   # Then run tests
```

**Test server not starting?**

```bash
cd packages/form-renderer/test-server
yarn install
yarn dev
```

**Build errors?**

```bash
yarn clean
yarn install
yarn build
```
