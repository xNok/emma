/**
 * Form Builder Tests - Test form bundle generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { EmmaConfig } from '../config.js';
import { FormBuilder } from '../form-builder.js';
import type { FormSchema } from '@emma/shared/types';

describe('FormBuilder', () => {
  let testDir: string;
  let config: EmmaConfig;
  let builder: FormBuilder;

  const mockSchema: FormSchema = {
    formId: 'contact-form-001',
    name: 'Contact Form',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3333/api/submit/contact-form-001',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Your Name',
        required: true,
        validation: {
          minLength: 2,
          maxLength: 100,
        },
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        rows: 5,
        required: true,
      },
    ],
    settings: {
      submitButtonText: 'Send Message',
      successMessage: 'Thank you for your message!',
      errorMessage: 'Please fix the errors and try again.',
      honeypot: {
        enabled: true,
        fieldName: 'website',
      },
    },
  };

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = path.join(os.tmpdir(), `emma-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    config = new EmmaConfig(testDir);
    await config.initialize();
    builder = new FormBuilder(config);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('build', () => {
    it('should generate form bundle with correct structure', async () => {
      const result = await builder.build('contact-form-001', mockSchema);

      expect(result.bundlePath).toMatch(
        /contact-form-001\/contact-form-001\.js$/
      );
      expect(result.outputDir).toMatch(/contact-form-001$/);
      expect(result.size).toBeGreaterThan(0);

      // Check that bundle file exists
      expect(await fs.pathExists(result.bundlePath)).toBe(true);
    });

    it('should create test HTML files', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const landingPagePath = path.join(result.outputDir, 'index.html');
      const previewPath = path.join(result.outputDir, 'preview.html');

      expect(await fs.pathExists(landingPagePath)).toBe(true);
      expect(await fs.pathExists(previewPath)).toBe(true);

      const landingPageContent = await fs.readFile(landingPagePath, 'utf8');
      expect(landingPageContent).toContain('Built by Emma');

      const previewContent = await fs.readFile(previewPath, 'utf8');
      expect(previewContent).toContain('Form Preview');
    });

    it('should embed schema in bundle', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('FORM_SCHEMA');
      expect(bundleContent).toContain('contact-form-001');
      expect(bundleContent).toContain('Contact Form');
      expect(bundleContent).toContain('Your Name');
      expect(bundleContent).toContain('Email Address');
    });

    it('should generate valid JavaScript (ESM module)', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      // Should be an ESM module with import statement
      expect(bundleContent).toContain(
        "import FormRenderer from './emma-forms.esm.js'"
      );

      // Basic structure checks (can't use Function constructor with ESM)
      expect(bundleContent).toContain('const FORM_SCHEMA');
      expect(bundleContent).toContain('function init()');
    });

    it('should initialize renderer runtime', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      // Uses ESM imports instead of window globals
      expect(bundleContent).toContain(
        "import FormRenderer from './emma-forms.esm.js'"
      );
      // Embeds schema and exports for manual use
      expect(bundleContent).toContain('FORM_SCHEMA');
      expect(bundleContent).toContain('export { FORM_SCHEMA, FormRenderer }');
    });

    it('should embed schema with different field types', async () => {
      const complexSchema: FormSchema = {
        ...mockSchema,
        fields: [
          { id: 'text', type: 'text', label: 'Text' },
          { id: 'email', type: 'email', label: 'Email' },
          { id: 'number', type: 'number', label: 'Number' },
          { id: 'textarea', type: 'textarea', label: 'Text Area', rows: 5 },
          {
            id: 'select',
            type: 'select',
            label: 'Select',
            options: [
              { value: 'opt1', label: 'Option 1' },
              { value: 'opt2', label: 'Option 2' },
            ],
          },
          {
            id: 'radio',
            type: 'radio',
            label: 'Radio',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
          },
          {
            id: 'checkbox',
            type: 'checkbox',
            label: 'Checkbox',
            options: [
              { value: 'cb1', label: 'Checkbox 1' },
              { value: 'cb2', label: 'Checkbox 2' },
            ],
          },
          {
            id: 'hidden',
            type: 'hidden',
            label: 'Hidden',
            defaultValue: 'hidden-value',
          },
        ],
      };

      const result = await builder.build('complex-form', complexSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      // Check schema JSON contains various field types
      expect(bundleContent).toContain('"type": "text"');
      expect(bundleContent).toContain('"type": "textarea"');
      expect(bundleContent).toContain('"type": "select"');
      expect(bundleContent).toContain('"type": "radio"');
      expect(bundleContent).toContain('"type": "checkbox"');
    });

    it('should include honeypot configuration in schema', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('"honeypot"');
      expect(bundleContent).toContain('"enabled": true');
      expect(bundleContent).toContain('"fieldName": "website"');
    });

    it('should handle form without honeypot settings', async () => {
      const schemaWithoutHoneypot: FormSchema = {
        ...mockSchema,
        settings: {
          ...mockSchema.settings,
          honeypot: {
            enabled: false,
            fieldName: 'website',
          },
        },
      };

      const result = await builder.build(
        'no-honeypot-form',
        schemaWithoutHoneypot
      );
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('"honeypot"');
      expect(bundleContent).toContain('"enabled": false');
    });

    it('should include validation attributes in schema', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('"required": true');
      expect(bundleContent).toContain('"minLength"');
      expect(bundleContent).toContain('"maxLength"');
    });

    it('should include API endpoint in schema', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain(mockSchema.apiEndpoint);
    });
  });

  describe('error handling', () => {
    it('should handle missing output directory creation', async () => {
      // This should not throw as FormBuilder creates directories
      await expect(
        builder.build('test-form', mockSchema)
      ).resolves.toBeDefined();
    });

    it('should handle schema serialization', async () => {
      const schemaWithUndefined = {
        ...mockSchema,
        undefinedProperty: undefined,
      };

      const result = await builder.build(
        'test-form',
        schemaWithUndefined as FormSchema
      );
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      // Should handle undefined properties gracefully
      expect(bundleContent).toContain('FORM_SCHEMA');
    });
  });
});
