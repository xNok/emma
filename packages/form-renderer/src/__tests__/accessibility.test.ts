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
