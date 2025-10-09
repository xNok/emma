# Automated Testing

**Package:** `@emma/form-renderer`

## Quick Start

```bash
# Run all tests
yarn test

# Run tests for specific package
yarn workspace @emma/form-renderer test

# Run with coverage
yarn workspace @emma/form-renderer test --coverage
```

## Test Structure

```
packages/form-renderer/src/__tests__/
├── FormRenderer.test.ts          # Core rendering
├── validation.test.ts            # Field validation
├── submission.test.ts            # Form submission
└── accessibility.test.ts         # A11y compliance
```

## Coverage Target

**Minimum:** 80% code coverage

View detailed coverage report:
```bash
yarn workspace @emma/form-renderer test --coverage
# Opens coverage/index.html
```

## CI Integration

Tests run automatically on every push and pull request via GitHub Actions:
- Linting
- Type checking
- All test suites
- Coverage reporting

See `.github/workflows/lint-test.yaml` for configuration.
