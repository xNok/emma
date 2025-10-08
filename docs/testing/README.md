# Emma Form Renderer - Testing

## ⚡ Quick Start

```bash
# Automated Tests
cd packages/form-renderer
yarn test
yarn test --coverage

# Manual Testing (Interactive)
cd packages/form-renderer/test-server
yarn install  # First time only
yarn dev
# Open http://localhost:3000
```

## � What's Included

**Automated Tests** (`src/__tests__/`)
- ✅ Core rendering tests
- ✅ Validation tests  
- ✅ Submission tests
- ✅ Accessibility tests

**Manual Test Server** (`test-server/`)
- ✅ 5 interactive scenarios
- ✅ Visual test checklists
- ✅ Real-time feedback
- ✅ Console logging

## 🧪 Manual Test Scenarios

The test server provides 5 interactive scenarios:

1. **Contact Form** - All field types, complex validation
2. **Newsletter** - Simple form, email validation  
3. **Survey** - Number validation, ratings, checkboxes
4. **Validation** - All validation rules and error handling
5. **Accessibility** - ARIA attributes, keyboard navigation

Each scenario includes:
- Visual checklist of things to test
- Real-time console output
- Success/error feedback
- Form reset after submission

## 📊 Coverage

**Target:** 80%+ code coverage

```bash
yarn test --coverage
```

Open `coverage/index.html` to see detailed report.

---

## � Troubleshooting

```bash
# Tests not running?
cd packages/form-renderer
yarn install

# Test server not starting?
cd test-server
yarn install
yarn dev

# Build errors?
cd ../..
yarn build
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Test
  run: yarn workspace @emma/form-renderer test --coverage
```

---

**Status:** ✅ Ready to Test
