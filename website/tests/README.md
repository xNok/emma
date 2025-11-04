# Emma Website Tests

This directory contains Playwright end-to-end tests for the Emma documentation website.

## Overview

The test suite validates:

- Navigation functionality across all pages
- Responsive design on mobile, tablet, and desktop viewports
- Accessibility features (keyboard navigation, focus indicators, skip links)
- Dark mode support
- Interactive components (mobile menu, code copy buttons)

## Running Tests

### Prerequisites

1. Install dependencies:

   ```bash
   cd website
   yarn install
   ```

2. Install Playwright browsers:
   ```bash
   yarn playwright install
   ```

### Running All Tests

```bash
cd website
yarn test
```

This will:

1. Start the Hugo server automatically
2. Run tests across multiple browsers (Chromium, Firefox, WebKit)
3. Test both desktop and mobile viewports
4. Generate an HTML report

### Running Specific Tests

```bash
# Run only navigation tests
yarn test navigation.spec.ts

# Run only responsive design tests
yarn test responsive.spec.ts

# Run tests in a specific browser
yarn test --project=chromium

# Run tests in headed mode (watch browser)
yarn test:headed

# Run tests with UI mode for debugging
yarn test:ui

# Debug a specific test
yarn test:debug navigation.spec.ts
```

## Test Files

### `navigation.spec.ts`

Tests core navigation functionality:

- Homepage loading and content
- Documentation page navigation
- Sidebar navigation
- Pagination between pages
- Header and footer consistency
- Code block copy buttons
- Accessibility skip links

### `responsive.spec.ts`

Tests responsive design:

- Mobile viewport (375x667) - Mobile menu, touch targets
- Tablet viewport (768x1024) - Two-column layout
- Desktop viewport (1920x1080) - Full sidebar, optimal width
- Dark mode support
- No horizontal scroll validation
- Keyboard navigation
- Focus indicators

## Configuration

The test configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:8080/emma/`
- **Hugo Server**: Automatically started before tests
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Screenshots**: Captured on failure
- **Traces**: Recorded on first retry

## CI/CD Integration

Tests are designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: yarn install

- name: Install Playwright browsers
  run: cd website && yarn playwright install --with-deps

- name: Run tests
  run: cd website && yarn test

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: website/playwright-report/
```

## Debugging Failed Tests

1. **View HTML Report**:

   ```bash
   yarn playwright show-report
   ```

2. **Run in Debug Mode**:

   ```bash
   yarn test:debug
   ```

3. **Check Screenshots**:
   Failed test screenshots are saved in `test-results/`

4. **View Traces**:
   Traces are captured on retry and can be viewed with:
   ```bash
   yarn playwright show-trace test-results/path-to-trace.zip
   ```

## Writing New Tests

Follow these conventions:

1. **Use Descriptive Test Names**:

   ```typescript
   test('should display mobile menu toggle button', async ({ page }) => {
     // Test code
   });
   ```

2. **Use Semantic Locators**:

   ```typescript
   // Prefer getByRole, getByLabel, getByText
   await page.getByRole('button', { name: 'Toggle menu' });
   ```

3. **Group Related Tests**:

   ```typescript
   test.describe('Mobile Navigation', () => {
     test.use({ viewport: { width: 375, height: 667 } });
     // Mobile tests
   });
   ```

4. **Check for Visibility and Behavior**:
   ```typescript
   await expect(element).toBeVisible();
   await expect(element).toHaveClass(/active/);
   ```

## Best Practices

- ✅ Test user workflows, not implementation details
- ✅ Use semantic selectors (role, label) over CSS selectors
- ✅ Test across multiple viewports and browsers
- ✅ Include accessibility tests
- ✅ Keep tests isolated and independent
- ❌ Don't test Hugo internals
- ❌ Don't make tests depend on each other
- ❌ Don't use overly specific selectors

## Troubleshooting

### Hugo Server Not Starting

- Check that Hugo is installed: `hugo version`
- Verify port 8080 is not in use: `lsof -i :8080`
- Check `playwright.config.ts` webServer configuration

### Tests Failing Locally But Passing in CI

- Check viewport sizes match
- Verify Hugo version consistency
- Check for timing issues (add appropriate waits)

### Flaky Tests

- Add explicit waits: `await page.waitForSelector()`
- Check for animations (disable with CSS or wait)
- Increase timeout for slow operations

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Hugo Documentation](https://gohugo.io/documentation/)
- [Web.dev Accessibility Guide](https://web.dev/accessibility/)
