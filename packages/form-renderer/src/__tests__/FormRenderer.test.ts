import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FormRenderer } from '../index';
import type { FormSchema } from '@xnok/emma-shared/types';

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
    expect(options?.length).toBeGreaterThan(2);
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

    const radios = container.querySelectorAll(
      'input[type="radio"][name="size"]'
    );
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

    const checkboxes = container.querySelectorAll(
      'input[type="checkbox"][name="interests"]'
    );
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

    const hidden = container.querySelector(
      'input[type="hidden"][name="tracking_id"]'
    ) as HTMLInputElement;
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
