/**
 * Form schema validation utilities
 * Validates form schemas against the expected structure
 */

import type {
  FormSchema,
  FormField,
  FieldType,
  ValidationRules,
} from '../types/index.js';

const VALID_FIELD_TYPES: FieldType[] = [
  'text',
  'email',
  'textarea',
  'number',
  'tel',
  'url',
  'select',
  'radio',
  'checkbox',
  'date',
  'time',
  'datetime-local',
  'hidden',
];

const PATTERN_PRESETS: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  tel: /^\+?[\d\s\-()]+$/,
};

/**
 * Validates a complete form schema
 */
export function validateFormSchema(schema: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof schema !== 'object' || schema === null) {
    return { valid: false, errors: ['Schema must be an object'] };
  }

  const s = schema as Partial<FormSchema>;

  // Validate required fields
  if (!s.formId || typeof s.formId !== 'string') {
    errors.push('formId is required and must be a string');
  }

  if (!s.name || typeof s.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!s.version || typeof s.version !== 'string') {
    errors.push('version is required and must be a string');
  }

  if (!s.theme || typeof s.theme !== 'string') {
    errors.push('theme is required and must be a string');
  }

  if (!s.apiEndpoint || typeof s.apiEndpoint !== 'string') {
    errors.push('apiEndpoint is required and must be a string');
  }

  if (!Array.isArray(s.fields)) {
    errors.push('fields is required and must be an array');
  } else {
    // Validate each field
    s.fields.forEach((field, index) => {
      const fieldErrors = validateFormField(field);
      fieldErrors.forEach((error) => {
        errors.push(`Field ${index} (${field.id || 'unknown'}): ${error}`);
      });
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a single form field
 */
export function validateFormField(field: unknown): string[] {
  const errors: string[] = [];

  if (typeof field !== 'object' || field === null) {
    return ['Field must be an object'];
  }

  const f = field as Partial<FormField>;

  // Required properties
  if (!f.id || typeof f.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!f.type || !VALID_FIELD_TYPES.includes(f.type as FieldType)) {
    errors.push(
      `type is required and must be one of: ${VALID_FIELD_TYPES.join(', ')}`
    );
  }

  if (!f.label || typeof f.label !== 'string') {
    errors.push('label is required and must be a string');
  }

  // Validate options for select/radio/checkbox
  if (f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') {
    if (!Array.isArray(f.options) || f.options.length === 0) {
      errors.push(`${f.type} fields must have at least one option`);
    } else {
      f.options.forEach((option, idx) => {
        if (!option.value || !option.label) {
          errors.push(`Option ${idx} must have value and label`);
        }
      });
    }
  }

  // Validate validation rules
  if (f.validation) {
    const validationErrors = validateValidationRules(f.validation, f.type);
    errors.push(...validationErrors);
  }

  return errors;
}

/**
 * Validates validation rules
 */
export function validateValidationRules(
  rules: unknown,
  fieldType?: FieldType
): string[] {
  const errors: string[] = [];

  if (typeof rules !== 'object' || rules === null) {
    return ['Validation rules must be an object'];
  }

  const r = rules as Partial<ValidationRules>;

  // minLength/maxLength only for text-like fields
  if (r.minLength !== undefined) {
    if (typeof r.minLength !== 'number' || r.minLength < 0) {
      errors.push('minLength must be a non-negative number');
    }
  }

  if (r.maxLength !== undefined) {
    if (typeof r.maxLength !== 'number' || r.maxLength < 0) {
      errors.push('maxLength must be a non-negative number');
    }
  }

  if (
    r.minLength !== undefined &&
    r.maxLength !== undefined &&
    r.minLength > r.maxLength
  ) {
    errors.push('minLength cannot be greater than maxLength');
  }

  // min/max only for number fields
  if (fieldType === 'number') {
    if (r.min !== undefined && typeof r.min !== 'number') {
      errors.push('min must be a number');
    }
    if (r.max !== undefined && typeof r.max !== 'number') {
      errors.push('max must be a number');
    }
    if (
      r.min !== undefined &&
      r.max !== undefined &&
      r.min > r.max
    ) {
      errors.push('min cannot be greater than max');
    }
  }

  return errors;
}

/**
 * Validates submitted form data against a schema
 */
export function validateSubmissionData(
  data: Record<string, unknown>,
  schema: FormSchema
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Check required fields
  schema.fields.forEach((field) => {
    const value = data[field.id];

    // Check if required field is present
    if (field.required && (value === undefined || value === '')) {
      errors.push({
        field: field.id,
        message: `${field.label} is required`,
      });
      return;
    }

    // Skip validation if field is empty and not required
    if (!value && !field.required) {
      return;
    }

    // Type-specific validation
    if (field.validation) {
      const fieldErrors = validateFieldValue(
        field.id,
        value,
        field.type,
        field.validation,
        field.label
      );
      errors.push(...fieldErrors);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a single field value
 */
function validateFieldValue(
  fieldId: string,
  value: unknown,
  type: FieldType,
  rules: ValidationRules,
  label: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const strValue = String(value);

  // Pattern validation
  if (rules.pattern) {
    let regex: RegExp;
    if (typeof rules.pattern === 'string') {
      // Check if it's a preset
      if (rules.pattern in PATTERN_PRESETS) {
        regex = PATTERN_PRESETS[rules.pattern];
      } else {
        regex = new RegExp(rules.pattern);
      }

      if (!regex.test(strValue)) {
        errors.push({
          field: fieldId,
          message: `${label} has an invalid format`,
        });
      }
    }
  }

  // Length validation
  if (rules.minLength !== undefined && strValue.length < rules.minLength) {
    errors.push({
      field: fieldId,
      message: `${label} must be at least ${rules.minLength} characters`,
    });
  }

  if (rules.maxLength !== undefined && strValue.length > rules.maxLength) {
    errors.push({
      field: fieldId,
      message: `${label} must be at most ${rules.maxLength} characters`,
    });
  }

  // Number validation
  if (type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push({
        field: fieldId,
        message: `${label} must be a valid number`,
      });
    } else {
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push({
          field: fieldId,
          message: `${label} must be at least ${rules.min}`,
        });
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push({
          field: fieldId,
          message: `${label} must be at most ${rules.max}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Type guard for ValidationError
 */
export interface ValidationError {
  field: string;
  message: string;
}
