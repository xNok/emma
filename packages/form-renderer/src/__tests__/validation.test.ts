import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormRenderer } from '../index';
import type { FormSchema } from '@xnok/emma-shared/types';

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
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

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

    const input = container.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    input.value = 'ab';

    const form = container.querySelector('form');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

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

    const form = container.querySelector('form');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    const error = container.querySelector('#emma-error-name');
    expect(error?.textContent).toContain('required');

    const input = container.querySelector(
      'input[name="name"]'
    ) as HTMLInputElement;
    input.value = 'John';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(error?.textContent).toBe('');
  });
});
