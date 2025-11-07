/**
 * Form Schema Builder - Business logic for creating and modifying form schemas
 * Decoupled from terminal UI
 */

import type {
  FormSchema,
  FormField,
  HoneypotSettings,
} from '@xnok/emma-shared/types';

export interface FormSchemaOptions {
  formId: string;
  name: string;
  theme: string;
  apiEndpoint: string;
  fields: FormField[];
  submitButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
  honeypot?: HoneypotSettings;
}

/**
 * Build a complete form schema with snapshot tracking
 */
export function buildFormSchema(options: FormSchemaOptions): FormSchema {
  const now = Math.floor(Date.now() / 1000); // Unix timestamp

  // Mark fields with creation timestamp
  options.fields.forEach((field) => {
    if (!field.addedAt) {
      field.addedAt = now;
    }
  });

  const schema: FormSchema = {
    formId: options.formId,
    name: options.name,
    version: '1.0.0',
    theme: options.theme,
    apiEndpoint: options.apiEndpoint,
    fields: options.fields,
    settings: {
      submitButtonText: options.submitButtonText || 'Submit',
      successMessage:
        options.successMessage || 'Thank you for your submission!',
      errorMessage:
        options.errorMessage ||
        'There was an error submitting your form. Please try again.',
      honeypot: options.honeypot || {
        enabled: true,
        fieldName: 'website',
      },
    },
    // Initialize snapshot tracking
    createdAt: now,
    lastModified: now,
    currentSnapshot: now,
    snapshots: [
      {
        timestamp: now,
        r2Key: `${options.formId}-${now}.js`,
        changes: 'Initial version',
        deployed: false,
      },
    ],
  };

  return schema;
}

/**
 * Generate a unique form ID from a base name
 */
export function generateFormId(baseName: string): string {
  const baseId = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now().toString().slice(-3);
  return `${baseId}-${timestamp}`;
}

/**
 * Create a new snapshot for a form schema
 */
export function createSnapshot(
  schema: FormSchema,
  changes: string
): FormSchema {
  const now = Math.floor(Date.now() / 1000);

  const updatedSchema = {
    ...schema,
    lastModified: now,
    currentSnapshot: now,
    snapshots: [
      ...(schema.snapshots || []),
      {
        timestamp: now,
        r2Key: `${schema.formId}-${now}.js`,
        changes,
        deployed: false,
      },
    ],
  };

  return updatedSchema;
}

/**
 * Update form schema with new fields
 */
export function updateFormFields(
  schema: FormSchema,
  fields: FormField[]
): FormSchema {
  const now = Math.floor(Date.now() / 1000);

  return {
    ...schema,
    fields,
    lastModified: now,
  };
}

/**
 * Add a field to a form schema
 */
export function addFieldToSchema(
  schema: FormSchema,
  field: FormField
): FormSchema {
  const now = Math.floor(Date.now() / 1000);

  // Mark field with added timestamp if not already set
  if (!field.addedAt) {
    field.addedAt = now;
  }

  return {
    ...schema,
    fields: [...schema.fields, field],
    lastModified: now,
  };
}

/**
 * Remove a field from a form schema
 */
export function removeFieldFromSchema(
  schema: FormSchema,
  fieldId: string
): FormSchema {
  const now = Math.floor(Date.now() / 1000);

  return {
    ...schema,
    fields: schema.fields.filter((f) => f.id !== fieldId),
    lastModified: now,
  };
}

/**
 * Update a specific field in a form schema
 */
export function updateFieldInSchema(
  schema: FormSchema,
  fieldId: string,
  updatedField: FormField
): FormSchema {
  const now = Math.floor(Date.now() / 1000);

  return {
    ...schema,
    fields: schema.fields.map((f) =>
      f.id === fieldId ? { ...updatedField } : f
    ),
    lastModified: now,
  };
}
