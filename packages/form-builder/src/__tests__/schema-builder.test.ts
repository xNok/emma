/**
 * Schema Builder Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildFormSchema,
  generateFormId,
  createSnapshot,
  updateFormFields,
  addFieldToSchema,
  removeFieldFromSchema,
  updateFieldInSchema,
} from '../builders/schema-builder';
import type { FormSchema, FormField } from '@xnok/emma-shared/types';

describe('Schema Builder', () => {
  describe('generateFormId', () => {
    it('should generate ID from base name with timestamp', () => {
      const formId = generateFormId('contact-form');
      expect(formId).toMatch(/^contact-form-\d{3}$/);
    });

    it('should normalize spaces and special characters', () => {
      const formId = generateFormId('My Contact Form!');
      // Trailing special characters are now stripped
      expect(formId).toMatch(/^my-contact-form-\d{3}$/);
    });

    it('should handle multiple consecutive special characters', () => {
      const formId = generateFormId('form___with---dashes');
      expect(formId).toMatch(/^form-with-dashes-\d{3}$/);
    });

    it('should strip leading and trailing dashes', () => {
      const formId = generateFormId('!@#contact-form$%^');
      expect(formId).toMatch(/^contact-form-\d{3}$/);
    });
  });

  describe('buildFormSchema', () => {
    const mockFields: FormField[] = [
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
    ];

    it('should build complete form schema with defaults', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: mockFields,
      });

      expect(schema.formId).toBe('test-form');
      expect(schema.name).toBe('Test Form');
      expect(schema.theme).toBe('default');
      expect(schema.version).toBe('1.0.0');
      expect(schema.fields).toHaveLength(2);
      expect(schema.settings!.submitButtonText).toBe('Submit');
      expect(schema.settings!.successMessage).toBe(
        'Thank you for your submission!'
      );
      expect(schema.settings!.honeypot!.enabled).toBe(true);
    });

    it('should set timestamps on fields without addedAt', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: mockFields,
      });

      expect(schema.fields[0].addedAt).toBeDefined();
      expect(schema.fields[1].addedAt).toBeDefined();
      expect(typeof schema.fields[0].addedAt).toBe('number');
    });

    it('should preserve existing addedAt timestamps', () => {
      const existingTimestamp = 1234567890;
      const fieldsWithTimestamp: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          addedAt: existingTimestamp,
        },
      ];

      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: fieldsWithTimestamp,
      });

      expect(schema.fields[0].addedAt).toBe(existingTimestamp);
    });

    it('should use custom settings when provided', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: mockFields,
        submitButtonText: 'Send',
        successMessage: 'Form submitted!',
        errorMessage: 'Error occurred',
        honeypot: {
          enabled: false,
          fieldName: 'email_confirm',
        },
      });

      expect(schema.settings!.submitButtonText).toBe('Send');
      expect(schema.settings!.successMessage).toBe('Form submitted!');
      expect(schema.settings!.errorMessage).toBe('Error occurred');
      expect(schema.settings!.honeypot!.enabled).toBe(false);
      expect(schema.settings!.honeypot!.fieldName).toBe('email_confirm');
    });

    it('should initialize snapshot tracking', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: mockFields,
      });

      expect(schema.createdAt).toBeDefined();
      expect(schema.lastModified).toBeDefined();
      expect(schema.currentSnapshot).toBeDefined();
      expect(schema.snapshots).toHaveLength(1);
      expect(schema.snapshots![0].changes).toBe('Initial version');
      expect(schema.snapshots![0].deployed).toBe(false);
    });
  });

  describe('createSnapshot', () => {
    let baseSchema: FormSchema;

    beforeEach(() => {
      baseSchema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
      });
    });

    it('should create a new snapshot', () => {
      const updatedSchema = createSnapshot(baseSchema, 'Added email field');

      expect(updatedSchema.snapshots).toHaveLength(2);
      expect(updatedSchema.snapshots![1].changes).toBe('Added email field');
      expect(updatedSchema.snapshots![1].deployed).toBe(false);
    });

    it('should update lastModified and currentSnapshot', () => {
      const originalLastModified = baseSchema.lastModified;
      const originalSnapshot = baseSchema.currentSnapshot;

      // Wait a tiny bit to ensure timestamp changes
      const updatedSchema = createSnapshot(baseSchema, 'Test change');

      expect(updatedSchema.lastModified).toBeGreaterThanOrEqual(
        originalLastModified!
      );
      expect(updatedSchema.currentSnapshot).toBeGreaterThanOrEqual(
        originalSnapshot!
      );
    });

    it('should preserve existing snapshots', () => {
      const firstUpdate = createSnapshot(baseSchema, 'First change');
      const secondUpdate = createSnapshot(firstUpdate, 'Second change');

      expect(secondUpdate.snapshots).toHaveLength(3);
      expect(secondUpdate.snapshots![0].changes).toBe('Initial version');
      expect(secondUpdate.snapshots![1].changes).toBe('First change');
      expect(secondUpdate.snapshots![2].changes).toBe('Second change');
    });
  });

  describe('updateFormFields', () => {
    it('should update fields and lastModified', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
      });

      const newFields: FormField[] = [
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
        },
      ];

      const updated = updateFormFields(schema, newFields);

      expect(updated.fields).toHaveLength(1);
      expect(updated.fields[0].id).toBe('email');
      expect(updated.lastModified).toBeGreaterThanOrEqual(schema.lastModified!);
    });
  });

  describe('addFieldToSchema', () => {
    it('should add field to schema', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
      });

      const newField: FormField = {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      };

      const updated = addFieldToSchema(schema, newField);

      expect(updated.fields).toHaveLength(2);
      expect(updated.fields[1].id).toBe('email');
    });

    it('should set addedAt if not present', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [],
      });

      const newField: FormField = {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      };

      const updated = addFieldToSchema(schema, newField);

      expect(updated.fields[0].addedAt).toBeDefined();
    });

    it('should preserve addedAt if already set', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [],
      });

      const existingTimestamp = 1234567890;
      const newField: FormField = {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        addedAt: existingTimestamp,
      };

      const updated = addFieldToSchema(schema, newField);

      expect(updated.fields[0].addedAt).toBe(existingTimestamp);
    });
  });

  describe('removeFieldFromSchema', () => {
    it('should remove field by id', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
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
      });

      const updated = removeFieldFromSchema(schema, 'email');

      expect(updated.fields).toHaveLength(1);
      expect(updated.fields[0].id).toBe('name');
    });

    it('should update lastModified', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
      });

      const originalLastModified = schema.lastModified;
      const updated = removeFieldFromSchema(schema, 'name');

      expect(updated.lastModified).toBeGreaterThanOrEqual(
        originalLastModified!
      );
    });
  });

  describe('updateFieldInSchema', () => {
    it('should update specific field by id', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
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
      });

      const updatedField: FormField = {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: false,
        placeholder: 'Enter your full name',
      };

      const updated = updateFieldInSchema(schema, 'name', updatedField);

      expect(updated.fields[0].label).toBe('Full Name');
      expect(updated.fields[0].required).toBe(false);
      expect(updated.fields[0].placeholder).toBe('Enter your full name');
      expect(updated.fields[1].id).toBe('email'); // Other fields unchanged
    });

    it('should update lastModified', () => {
      const schema = buildFormSchema({
        formId: 'test-form',
        name: 'Test Form',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
      });

      const originalLastModified = schema.lastModified;
      const updatedField: FormField = {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
      };

      const updated = updateFieldInSchema(schema, 'name', updatedField);

      expect(updated.lastModified).toBeGreaterThanOrEqual(
        originalLastModified!
      );
    });
  });
});
