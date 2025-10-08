# Automated Testing Guide - Form Renderer

**Date:** October 7, 2025  
**Status:** Ready for Implementation  
**Package:** `@emma/form-renderer`

## Overview

This document outlines the automated testing strategy for the Form Renderer package using Vitest. The tests ensure that all form rendering, validation, and submission logic works correctly.

---

## Test Setup

### 1. Install Testing Dependencies

The package already has Vitest configured in `package.json`. Ensure all dependencies are installed:

```bash
cd packages/form-renderer
yarn install
```

### 2. Test File Structure

Create the following test files:

```
packages/form-renderer/
├── src/
│   ├── index.ts
│   └── __tests__/
│       ├── FormRenderer.test.ts          # Core rendering tests
│       ├── FormRenderer.validation.test.ts # Validation tests
│       ├── FormRenderer.submission.test.ts # Submission tests
│       └── FormRenderer.accessibility.test.ts # A11y tests
└── vitest.config.ts
```

---

## Test Implementation

### 1. Vitest Configuration

Create `packages/form-renderer/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.test.ts',
      ],
    },
  },
});
```

### 2. Install Additional Dependencies

```bash
cd packages/form-renderer
yarn add -D jsdom @vitest/ui happy-dom
```

---

## Test Suites

### Test Suite 1: Core Rendering (`FormRenderer.test.ts`)

**Purpose:** Test that forms render correctly with all field types.

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FormRenderer } from '../index';
import type { FormSchema } from '@emma/shared/types';

describe('FormRenderer - Core Rendering', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-form-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create a form renderer instance', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    expect(renderer).toBeDefined();
  });

  it('should throw error if container not found', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [],
    };

    expect(() => {
      new FormRenderer({
        formId: 'test-form',
        containerId: 'non-existent',
        schema,
      });
    }).toThrow('Container non-existent not found');
  });

  it('should render a text input field', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const input = container.querySelector('input[name="name"]');
    expect(input).toBeDefined();
    expect(input?.getAttribute('type')).toBe('text');
    expect(input?.getAttribute('required')).toBe('');
  });

  it('should render a textarea field', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          rows: 5,
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const textarea = container.querySelector('textarea[name="message"]');
    expect(textarea).toBeDefined();
    expect(textarea?.getAttribute('rows')).toBe('5');
  });

  it('should render a select dropdown', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'country',
          type: 'select',
          label: 'Country',
          options: [
            { value: 'us', label: 'United States' },
            { value: 'ca', label: 'Canada' },
          ],
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const select = container.querySelector('select[name="country"]');
    expect(select).toBeDefined();
    
    const options = select?.querySelectorAll('option');
    expect(options?.length).toBeGreaterThan(2); // includes placeholder
  });

  it('should render radio buttons', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'size',
          type: 'radio',
          label: 'Size',
          options: [
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large' },
          ],
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const radios = container.querySelectorAll('input[type="radio"][name="size"]');
    expect(radios.length).toBe(3);
  });

  it('should render checkboxes', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'interests',
          type: 'checkbox',
          label: 'Interests',
          options: [
            { value: 'tech', label: 'Technology' },
            { value: 'sports', label: 'Sports' },
          ],
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const checkboxes = container.querySelectorAll('input[type="checkbox"][name="interests"]');
    expect(checkboxes.length).toBe(2);
  });

  it('should render hidden field', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'tracking_id',
          type: 'hidden',
          label: 'Tracking ID',
          defaultValue: '12345',
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const hidden = container.querySelector('input[type="hidden"][name="tracking_id"]') as HTMLInputElement;
    expect(hidden).toBeDefined();
    expect(hidden?.value).toBe('12345');
  });

  it('should render honeypot when enabled', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [],
      settings: {
        honeypot: {
          enabled: true,
          fieldName: 'website',
        },
      },
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toBeDefined();
    expect(honeypot?.closest('.emma-form-honeypot')).toBeDefined();
  });

  it('should render submit button with custom text', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [],
      settings: {
        submitButtonText: 'Send Now',
      },
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const button = container.querySelector('button[type="submit"]');
    expect(button?.textContent).toBe('Send Now');
  });
});
```

### Test Suite 2: Validation (`FormRenderer.validation.test.ts`)

**Purpose:** Test client-side validation logic.

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormRenderer } from '../index';
import type { FormSchema } from '@emma/shared/types';

describe('FormRenderer - Validation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-form-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should show error for empty required field on submit', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const onSubmit = vi.fn();

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
      onSubmit,
    });

    renderer.render();

    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Wait for validation
    await new Promise(resolve => setTimeout(resolve, 10));

    const error = container.querySelector('#emma-error-name');
    expect(error?.textContent).toContain('required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should validate minLength', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'username',
          type: 'text',
          label: 'Username',
          required: true,
          validation: {
            minLength: 3,
          },
        },
      ],
    };

    const onSubmit = vi.fn();

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
      onSubmit,
    });

    renderer.render();

    const input = container.querySelector('input[name="username"]') as HTMLInputElement;
    input.value = 'ab'; // Too short

    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    const error = container.querySelector('#emma-error-username');
    expect(error?.textContent).toContain('at least 3');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should clear error on input', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    // Trigger error
    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    const error = container.querySelector('#emma-error-name');
    expect(error?.textContent).toContain('required');

    // Type in field
    const input = container.querySelector('input[name="name"]') as HTMLInputElement;
    input.value = 'John';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(error?.textContent).toBe('');
  });
});
```

### Test Suite 3: Submission (`FormRenderer.submission.test.ts`)

**Purpose:** Test form submission behavior.

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormRenderer } from '../index';
import type { FormSchema } from '@emma/shared/types';

describe('FormRenderer - Submission', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-form-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should call onSubmit with form data', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
        },
      ],
    };

    const onSubmit = vi.fn();

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
      onSubmit,
    });

    renderer.render();

    // Fill form
    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    nameInput.value = 'John Doe';
    emailInput.value = 'john@example.com';

    // Submit
    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should submit to API when no onSubmit provided', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit/test-form',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
      settings: {
        successMessage: 'Success!',
      },
    };

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    // Fill form
    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
    nameInput.value = 'John Doe';

    // Submit
    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test.com/submit/test-form',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const message = container.querySelector('.emma-form-messages');
    expect(message?.textContent).toBe('Success!');
  });

  it('should block bot submissions with honeypot', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
      settings: {
        honeypot: {
          enabled: true,
          fieldName: 'website',
        },
        successMessage: 'Success!',
      },
    };

    const onSubmit = vi.fn();

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
      onSubmit,
    });

    renderer.render();

    // Fill form (including honeypot - bot behavior)
    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
    const honeypot = container.querySelector('input[name="website"]') as HTMLInputElement;
    nameInput.value = 'Bot Name';
    honeypot.value = 'http://spam.com';

    // Submit
    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    // Should not call API
    expect(onSubmit).not.toHaveBeenCalled();

    // Should show success message (silent fail)
    const message = container.querySelector('.emma-form-messages');
    expect(message?.textContent).toBe('Success!');
  });

  it('should handle API errors gracefully', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit/test-form',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
      settings: {
        errorMessage: 'Error occurred!',
      },
    };

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const onError = vi.fn();

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
      onError,
    });

    renderer.render();

    // Fill form
    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
    nameInput.value = 'John Doe';

    // Submit
    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 100));

    const message = container.querySelector('.emma-form-messages');
    expect(message?.textContent).toBe('Error occurred!');
    expect(onError).toHaveBeenCalled();
  });
});
```

### Test Suite 4: Accessibility (`FormRenderer.accessibility.test.ts`)

**Purpose:** Test ARIA attributes and accessibility features.

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FormRenderer } from '../index';
import type { FormSchema } from '@emma/shared/types';

describe('FormRenderer - Accessibility', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-form-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should add aria-describedby for help text', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'password',
          type: 'text',
          label: 'Password',
          helpText: 'Must be at least 8 characters',
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const input = container.querySelector('input[name="password"]');
    expect(input?.getAttribute('aria-describedby')).toBe('emma-help-password');
  });

  it('should add aria-invalid on error', async () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    // Trigger validation error
    const form = container.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    const input = container.querySelector('input[name="name"]');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toContain('emma-error-name');
  });

  it('should add role="alert" to message container', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const messages = container.querySelector('.emma-form-messages');
    expect(messages?.getAttribute('role')).toBe('alert');
    expect(messages?.getAttribute('aria-live')).toBe('polite');
  });

  it('should add aria-label to required indicator', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const required = container.querySelector('.emma-form-required');
    expect(required?.getAttribute('aria-label')).toBe('required');
  });

  it('should add role="radiogroup" to radio buttons', () => {
    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.test.com/submit',
      fields: [
        {
          id: 'size',
          type: 'radio',
          label: 'Size',
          options: [
            { value: 's', label: 'Small' },
            { value: 'l', label: 'Large' },
          ],
        },
      ],
    };

    const renderer = new FormRenderer({
      formId: 'test-form',
      containerId: 'test-form-container',
      schema,
    });

    renderer.render();

    const radioGroup = container.querySelector('.emma-form-radio-group');
    expect(radioGroup?.getAttribute('role')).toBe('radiogroup');
  });
});
```

---

## Running the Tests

### Run All Tests

```bash
cd packages/form-renderer
yarn test
```

### Run Tests in Watch Mode

```bash
yarn test --watch
```

### Run Tests with Coverage

```bash
yarn test --coverage
```

### Run Specific Test Suite

```bash
yarn test FormRenderer.test.ts
```

### Run Tests with UI

```bash
yarn test --ui
```

---

## Expected Coverage Targets

| Category | Target Coverage |
|----------|----------------|
| Statements | ≥ 80% |
| Branches | ≥ 75% |
| Functions | ≥ 80% |
| Lines | ≥ 80% |

---

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run tests
        run: yarn workspace @emma/form-renderer test --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/form-renderer/coverage/coverage-final.json
```

---

## Next Steps

1. **Create test files** in `packages/form-renderer/src/__tests__/`
2. **Run tests** to verify implementation
3. **Fix any failing tests**
4. **Add more edge case tests** as needed
5. **Integrate with CI/CD** pipeline

---

**Related Documents:**
- [Manual Testing Guide](./02-manual-testing.md)
- [Form Renderer Summary](../agents-summaries/01-form-renderer-summary.md)
- [Technical Architecture](../02-technical-architecture.md)
