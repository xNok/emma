import { describe, it, expect } from 'vitest';
import { validateSubmissionData } from './validators';
import { FormSchema } from '../types';

describe('Validators', () => {
  const schema: FormSchema = {
    formId: 'test-form',
    name: 'Test Form',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'https://api.example.com',
    fields: [
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      },
      {
        id: 'custom',
        type: 'text',
        label: 'Custom',
        validation: {
          pattern: '^[A-Z]{3}-\\d{3}$', // Custom pattern: AAA-123
        },
      },
    ],
  };

  it('validates submission data correctly with custom pattern', () => {
    const validData = {
      email: 'test@example.com',
      custom: 'ABC-123',
    };
    const invalidData = {
      email: 'test@example.com',
      custom: 'abc-123',
    };

    expect(validateSubmissionData(validData, schema).valid).toBe(true);
    const result = validateSubmissionData(invalidData, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'custom',
      message: 'Custom has an invalid format',
    });
  });
});
