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

    const nameInput = container.querySelector(
      'input[name="name"]'
    ) as HTMLInputElement;
    const emailInput = container.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;
    nameInput.value = 'John Doe';
    emailInput.value = 'john@example.com';

    const form = container.querySelector('form');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
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

    const nameInput = container.querySelector(
      'input[name="name"]'
    ) as HTMLInputElement;
    const honeypot = container.querySelector(
      'input[name="website"]'
    ) as HTMLInputElement;
    nameInput.value = 'Bot Name';
    honeypot.value = 'http://spam.com';

    const form = container.querySelector('form');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onSubmit).not.toHaveBeenCalled();

    const message = container.querySelector('.emma-form-messages');
    expect(message?.textContent).toBe('Success!');
  });
});
