/**
 * Emma Form Renderer - Main Entry Point
 * Renders forms from schema and handles submissions
 */

import type {
  FormSchema,
  FormField,
  SubmissionResponse,
} from '@xnok/emma-shared/types';
import { validateSubmissionData } from '@xnok/emma-shared/schema';

export interface RenderOptions {
  formId: string;
  containerId: string;
  schema: FormSchema;
  theme?: string;
  onSubmit?: (data: Record<string, string | string[]>) => void;
  onSuccess?: (response: SubmissionResponse) => void;
  onError?: (error: Error) => void;
}

export class FormRenderer {
  private container: HTMLElement;
  private schema: FormSchema;
  private form: HTMLFormElement | null = null;
  private options: RenderOptions;

  constructor(options: RenderOptions) {
    this.options = options;
    this.schema = options.schema;

    const container = document.getElementById(options.containerId);
    if (!container) {
      throw new Error(`Container ${options.containerId} not found`);
    }
    this.container = container;
  }

  /**
   * Renders the form into the container
   */
  public render(): void {
    this.container.innerHTML = '';

    // Create form element
    const form = document.createElement('form');
    form.className = 'emma-form';
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (event: Event) => {
      void this.handleSubmit(event);
    });

    // Render each field
    this.schema.fields.forEach((field) => {
      if (field.type === 'hidden') {
        form.appendChild(this.renderHiddenField(field));
      } else {
        const fieldGroup = this.renderFieldGroup(field);
        form.appendChild(fieldGroup);
      }
    });

    // Add honeypot if enabled
    if (this.schema.settings?.honeypot?.enabled) {
      const honeypot = this.renderHoneypot(
        this.schema.settings.honeypot.fieldName
      );
      form.appendChild(honeypot);
    }

    // Add submit button
    const submitButton = this.renderSubmitButton();
    form.appendChild(submitButton);

    // Add message containers
    const messageContainer = document.createElement('div');
    messageContainer.className = 'emma-form-messages';
    messageContainer.setAttribute('role', 'alert');
    messageContainer.setAttribute('aria-live', 'polite');
    form.appendChild(messageContainer);

    this.form = form;
    this.container.appendChild(this.form);
  }

  /**
   * Renders a field group (label + input + error)
   */
  private renderFieldGroup(field: FormField): HTMLDivElement {
    const group = document.createElement('div');
    group.className = `emma-form-group emma-form-group--${field.type}`;
    group.setAttribute('data-field-id', field.id);

    // Label
    const label = document.createElement('label');
    label.htmlFor = `emma-field-${field.id}`;
    label.className = 'emma-form-label';
    label.textContent = field.label;
    if (field.required) {
      const required = document.createElement('span');
      required.className = 'emma-form-required';
      required.textContent = ' *';
      required.setAttribute('aria-label', 'required');
      label.appendChild(required);
    }
    group.appendChild(label);

    // Help text
    if (field.helpText) {
      const help = document.createElement('small');
      help.className = 'emma-form-help';
      help.id = `emma-help-${field.id}`;
      help.textContent = field.helpText;
      group.appendChild(help);
    }

    // Input
    const input = this.renderInput(field);
    group.appendChild(input);

    // Error container
    const error = document.createElement('div');
    error.className = 'emma-form-error';
    error.id = `emma-error-${field.id}`;
    error.setAttribute('role', 'alert');
    group.appendChild(error);

    return group;
  }

  /**
   * Renders an input element based on field type
   */
  private renderInput(field: FormField): HTMLElement {
    switch (field.type) {
      case 'textarea':
        return this.renderTextarea(field);
      case 'select':
        return this.renderSelect(field);
      case 'radio':
        return this.renderRadio(field);
      case 'checkbox':
        return this.renderCheckbox(field);
      default:
        return this.renderTextInput(field);
    }
  }

  /**
   * Renders a text-like input (text, email, number, etc.)
   */
  private renderTextInput(field: FormField): HTMLInputElement {
    const input = document.createElement('input');
    input.type = field.type;
    input.id = `emma-field-${field.id}`;
    input.name = field.id;
    input.className = 'emma-form-input';

    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.required) input.required = true;
    if (field.autocomplete)
      input.setAttribute('autocomplete', field.autocomplete);
    if (field.defaultValue) input.value = String(field.defaultValue);

    // Validation attributes
    if (field.validation) {
      if (field.validation.minLength)
        input.minLength = field.validation.minLength;
      if (field.validation.maxLength)
        input.maxLength = field.validation.maxLength;
      if (field.validation.min) input.min = String(field.validation.min);
      if (field.validation.max) input.max = String(field.validation.max);
      if (
        field.validation.pattern &&
        typeof field.validation.pattern === 'string'
      ) {
        input.pattern = field.validation.pattern;
      }
    }

    // ARIA
    if (field.helpText) {
      input.setAttribute('aria-describedby', `emma-help-${field.id}`);
    }

    // Real-time validation
    input.addEventListener('blur', () => this.validateField(field.id));
    input.addEventListener('input', () => this.clearFieldError(field.id));

    return input;
  }

  /**
   * Renders a textarea
   */
  private renderTextarea(field: FormField): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.id = `emma-field-${field.id}`;
    textarea.name = field.id;
    textarea.className = 'emma-form-textarea';

    if (field.placeholder) textarea.placeholder = field.placeholder;
    if (field.required) textarea.required = true;
    if (field.rows) textarea.rows = field.rows;
    if (field.defaultValue) textarea.value = String(field.defaultValue);

    // Validation
    if (field.validation) {
      if (field.validation.minLength)
        textarea.minLength = field.validation.minLength;
      if (field.validation.maxLength)
        textarea.maxLength = field.validation.maxLength;
    }

    // ARIA
    if (field.helpText) {
      textarea.setAttribute('aria-describedby', `emma-help-${field.id}`);
    }

    textarea.addEventListener('blur', () => this.validateField(field.id));
    textarea.addEventListener('input', () => this.clearFieldError(field.id));

    return textarea;
  }

  /**
   * Renders a select dropdown
   */
  private renderSelect(field: FormField): HTMLSelectElement {
    const select = document.createElement('select');
    select.id = `emma-field-${field.id}`;
    select.name = field.id;
    select.className = 'emma-form-select';

    if (field.required) select.required = true;

    // Add placeholder option
    if (!field.required || field.placeholder) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = field.placeholder || 'Select an option...';
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);
    }

    // Add options
    field.options?.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.disabled) opt.disabled = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => this.validateField(field.id));

    return select;
  }

  /**
   * Renders radio buttons
   */
  private renderRadio(field: FormField): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'emma-form-radio-group';
    container.setAttribute('role', 'radiogroup');

    field.options?.forEach((option, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'emma-form-radio-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.id = `emma-field-${field.id}-${index}`;
      input.name = field.id;
      input.value = option.value;
      input.className = 'emma-form-radio-input';
      if (field.required && index === 0) input.required = true;

      const label = document.createElement('label');
      label.htmlFor = `emma-field-${field.id}-${index}`;
      label.className = 'emma-form-radio-label';
      label.textContent = option.label;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      container.appendChild(wrapper);

      input.addEventListener('change', () => this.validateField(field.id));
    });

    return container;
  }

  /**
   * Renders checkboxes
   */
  private renderCheckbox(field: FormField): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'emma-form-checkbox-group';

    field.options?.forEach((option, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'emma-form-checkbox-option';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `emma-field-${field.id}-${index}`;
      input.name = field.id;
      input.value = option.value;
      input.className = 'emma-form-checkbox-input';

      const label = document.createElement('label');
      label.htmlFor = `emma-field-${field.id}-${index}`;
      label.className = 'emma-form-checkbox-label';
      label.textContent = option.label;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      container.appendChild(wrapper);

      input.addEventListener('change', () => this.validateField(field.id));
    });

    return container;
  }

  /**
   * Renders a hidden field
   */
  private renderHiddenField(field: FormField): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = field.id;
    input.value = field.defaultValue ? String(field.defaultValue) : '';
    return input;
  }

  /**
   * Renders honeypot field (hidden from users, visible to bots)
   */
  private renderHoneypot(fieldName: string): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'emma-form-honeypot';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '1px';
    wrapper.style.height = '1px';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = fieldName;
    input.tabIndex = -1;
    input.autocomplete = 'off';

    wrapper.appendChild(input);
    return wrapper;
  }

  /**
   * Renders submit button
   */
  private renderSubmitButton(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'emma-form-submit-wrapper';

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'emma-form-submit';
    button.textContent = this.schema.settings?.submitButtonText || 'Submit';

    wrapper.appendChild(button);
    return wrapper;
  }

  /**
   * Handles form submission
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.form) return;

    // Clear previous messages
    this.clearMessages();

    // Get form data
    const formData = new FormData(this.form);
    const data: Record<string, string | string[]> = {};

    // Process form data
    formData.forEach((value, key) => {
      // Skip honeypot
      if (key === this.schema.settings?.honeypot?.fieldName) {
        return;
      }

      if (data[key]) {
        // Multiple values (checkbox)
        if (Array.isArray(data[key])) {
          data[key].push(value as string);
        } else {
          data[key] = [data[key], value as string];
        }
      } else {
        data[key] = value as string;
      }
    });

    // Check honeypot
    const honeypotValue = formData.get(
      this.schema.settings?.honeypot?.fieldName || ''
    );
    if (honeypotValue) {
      // Silent fail for bots
      this.showMessage('success', this.schema.settings?.successMessage);
      return;
    }

    // Validate
    const validation = validateSubmissionData(data, this.schema);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        this.showFieldError(error.field, error.message);
      });
      return;
    }

    // Custom onSubmit handler
    if (this.options.onSubmit) {
      this.options.onSubmit(data);
      return;
    }

    // Submit to API
    await this.submitToAPI(data);
  }

  /**
   * Submits data to the API
   */
  private async submitToAPI(
    data: Record<string, string | string[]>
  ): Promise<void> {
    try {
      const button = this.form?.querySelector('.emma-form-submit');
      if (button) {
        button.setAttribute('disabled', '');
        button.textContent = 'Submitting...';
      }

      const response = await fetch(this.schema.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: this.schema.formId,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          },
        }),
      });

      const result = (await response.json()) as SubmissionResponse;

      if (button) {
        button.removeAttribute('disabled');
        button.textContent = this.schema.settings?.submitButtonText || 'Submit';
      }

      if (result.success) {
        this.showMessage(
          'success',
          this.schema.settings?.successMessage ||
            'Thank you for your submission!'
        );
        this.form?.reset();

        if (this.options.onSuccess) {
          this.options.onSuccess(result);
        }

        // Redirect if configured
        const redirectUrl = this.schema.settings?.redirectUrl;
        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      const button = this.form?.querySelector('.emma-form-submit');
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = this.schema.settings?.submitButtonText || 'Submit';
      }

      this.showMessage(
        'error',
        this.schema.settings?.errorMessage ||
          'Something went wrong. Please try again.'
      );

      if (this.options.onError) {
        this.options.onError(error as Error);
      }
    }
  }

  /**
   * Validates a single field
   */
  private validateField(fieldId: string): boolean {
    const field = this.schema.fields.find((f) => f.id === fieldId);
    if (!field) return true;

    const input = this.form?.querySelector(
      `[name="${fieldId}"]`
    ) as HTMLInputElement;
    if (!input) return true;

    const value = input.value;

    // Required check
    if (field.required && !value) {
      this.showFieldError(fieldId, `${field.label} is required`);
      return false;
    }

    // Additional validation would go here
    this.clearFieldError(fieldId);
    return true;
  }

  /**
   * Shows an error for a specific field
   */
  private showFieldError(fieldId: string, message: string): void {
    const errorContainer = document.getElementById(`emma-error-${fieldId}`);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }

    const fieldGroup = this.form?.querySelector(`[data-field-id="${fieldId}"]`);
    if (fieldGroup) {
      fieldGroup.classList.add('emma-form-group--error');
    }

    const input = this.form?.querySelector(
      `[name="${fieldId}"]`
    ) as HTMLElement;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `emma-error-${fieldId}`);
    }
  }

  /**
   * Clears error for a specific field
   */
  private clearFieldError(fieldId: string): void {
    const errorContainer = document.getElementById(`emma-error-${fieldId}`);
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
    }

    const fieldGroup = this.form?.querySelector(`[data-field-id="${fieldId}"]`);
    if (fieldGroup) {
      fieldGroup.classList.remove('emma-form-group--error');
    }

    const input = this.form?.querySelector(
      `[name="${fieldId}"]`
    ) as HTMLElement;
    if (input) {
      input.removeAttribute('aria-invalid');
    }
  }

  /**
   * Shows a general message
   */
  private showMessage(type: 'success' | 'error', message?: string): void {
    const container = this.form?.querySelector('.emma-form-messages');
    if (!container || !message) return;

    container.className = `emma-form-messages emma-form-messages--${type}`;
    container.textContent = message;
  }

  /**
   * Clears all messages
   */
  private clearMessages(): void {
    const container = this.form?.querySelector('.emma-form-messages');
    if (container) {
      container.className = 'emma-form-messages';
      container.textContent = '';
    }

    // Clear field errors
    this.schema.fields.forEach((field) => {
      this.clearFieldError(field.id);
    });
  }
}

// Auto-initialize forms on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Forms will be initialized by generated bundles
  });
}

export default FormRenderer;
