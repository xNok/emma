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

    // Mock homedir to use test directory
    const originalHomedir = os.homedir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (os as any).homedir = () => testDir;

    config = new EmmaConfig();
    await config.initialize();
    builder = new FormBuilder(config);

    // Restore after each test
    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (os as any).homedir = originalHomedir;
    });
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

    it('should create test HTML file', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const htmlPath = path.join(result.outputDir, 'index.html');

      expect(await fs.pathExists(htmlPath)).toBe(true);

      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      expect(htmlContent).toContain('Contact Form');
      expect(htmlContent).toContain('contact-form-001');
      expect(htmlContent).toContain('contact-form-001.js');
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

    it('should generate valid JavaScript', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      // Basic syntax check - should not throw
      expect(() => new Function(bundleContent)).not.toThrow();
    });

    it('should include form renderer functionality', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('EmbeddedFormRenderer');
      expect(bundleContent).toContain('render');
      expect(bundleContent).toContain('handleSubmit');
      expect(bundleContent).toContain('renderField');
    });

    it('should handle different field types', async () => {
      const complexSchema: FormSchema = {
        ...mockSchema,
        fields: [
          { id: 'text', type: 'text', label: 'Text' },
          { id: 'email', type: 'email', label: 'Email' },
          { id: 'number', type: 'number', label: 'Number' },
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

      // Check that different field types are handled
      expect(bundleContent).toContain('input.type = field.type');
      expect(bundleContent).toContain("case 'textarea'");
      expect(bundleContent).toContain("case 'select'");
      expect(bundleContent).toContain("case 'radio'");
      expect(bundleContent).toContain("case 'checkbox'");
    });

    it('should include honeypot protection', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('createHoneypotField');
      expect(bundleContent).toContain('honeypot?.enabled');
      expect(bundleContent).toContain('website'); // Default honeypot field name
    });

    it('should handle form without honeypot', async () => {
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

      expect(bundleContent).toContain('honeypot?.enabled');
    });

    it('should include validation attributes', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain('input.required = true');
      expect(bundleContent).toContain('input.minLength');
      expect(bundleContent).toContain('input.maxLength');
    });

    it('should create correct API endpoint', async () => {
      const result = await builder.build('contact-form-001', mockSchema);
      const bundleContent = await fs.readFile(result.bundlePath, 'utf8');

      expect(bundleContent).toContain(mockSchema.apiEndpoint);
      expect(bundleContent).toContain('POST');
      expect(bundleContent).toContain('application/json');
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
