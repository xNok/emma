/**
 * Field Builder Tests
 */

import { describe, it, expect } from 'vitest';
import { buildField } from '../builders/field-builder';

describe('Field Builder', () => {
  describe('buildField', () => {
    it('should build basic text field', () => {
      const field = buildField('name', 'text', 'Name');

      expect(field.id).toBe('name');
      expect(field.type).toBe('text');
      expect(field.label).toBe('Name');
      expect(field.required).toBe(false);
    });

    it('should build required field', () => {
      const field = buildField('email', 'email', 'Email', {
        required: true,
      });

      expect(field.required).toBe(true);
    });

    it('should include placeholder', () => {
      const field = buildField('name', 'text', 'Name', {
        placeholder: 'Enter your name',
      });

      expect(field.placeholder).toBe('Enter your name');
    });

    it('should build textarea with rows', () => {
      const field = buildField('message', 'textarea', 'Message', {
        rows: 5,
        required: true,
      });

      expect(field.type).toBe('textarea');
      expect(field.rows).toBe(5);
      expect(field.required).toBe(true);
    });

    it('should build hidden field with default value', () => {
      const field = buildField('source', 'hidden', 'Source', {
        defaultValue: 'website',
      });

      expect(field.type).toBe('hidden');
      expect(field.defaultValue).toBe('website');
    });

    it('should build select field with options', () => {
      const field = buildField('country', 'select', 'Country', {
        required: true,
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'mx', label: 'Mexico' },
        ],
      });

      expect(field.type).toBe('select');
      expect(field.options).toHaveLength(3);
      expect(field.options![0].value).toBe('us');
      expect(field.options![0].label).toBe('United States');
    });

    it('should build radio field with options', () => {
      const field = buildField('size', 'radio', 'Size', {
        required: true,
        options: [
          { value: 's', label: 'Small' },
          { value: 'm', label: 'Medium' },
          { value: 'l', label: 'Large' },
        ],
      });

      expect(field.type).toBe('radio');
      expect(field.options).toHaveLength(3);
    });

    it('should build checkbox field with options', () => {
      const field = buildField('interests', 'checkbox', 'Interests', {
        options: [
          { value: 'sports', label: 'Sports' },
          { value: 'music', label: 'Music' },
          { value: 'reading', label: 'Reading' },
        ],
      });

      expect(field.type).toBe('checkbox');
      expect(field.options).toHaveLength(3);
    });

    it('should include validation rules', () => {
      const field = buildField('username', 'text', 'Username', {
        required: true,
        validation: {
          minLength: 3,
          maxLength: 20,
        },
      });

      expect(field.validation).toBeDefined();
      expect(field.validation!.minLength).toBe(3);
      expect(field.validation!.maxLength).toBe(20);
    });

    it('should include addedAt timestamp', () => {
      const timestamp = 1234567890;
      const field = buildField('name', 'text', 'Name', {
        addedAt: timestamp,
      });

      expect(field.addedAt).toBe(timestamp);
    });

    it('should build number field with min/max validation', () => {
      const field = buildField('age', 'number', 'Age', {
        required: true,
        validation: {
          min: 18,
          max: 120,
        },
      });

      expect(field.type).toBe('number');
      expect(field.validation!.min).toBe(18);
      expect(field.validation!.max).toBe(120);
    });

    it('should build email field', () => {
      const field = buildField('email', 'email', 'Email Address', {
        required: true,
        placeholder: 'your@email.com',
      });

      expect(field.type).toBe('email');
      expect(field.placeholder).toBe('your@email.com');
    });

    it('should build tel field', () => {
      const field = buildField('phone', 'tel', 'Phone Number', {
        required: true,
        placeholder: '+1 (555) 123-4567',
      });

      expect(field.type).toBe('tel');
      expect(field.placeholder).toBe('+1 (555) 123-4567');
    });

    it('should build url field', () => {
      const field = buildField('website', 'url', 'Website', {
        placeholder: 'https://example.com',
      });

      expect(field.type).toBe('url');
      expect(field.placeholder).toBe('https://example.com');
    });

    it('should build date field', () => {
      const field = buildField('birthdate', 'date', 'Birth Date', {
        required: true,
      });

      expect(field.type).toBe('date');
      expect(field.required).toBe(true);
    });

    it('should build time field', () => {
      const field = buildField('appointment', 'time', 'Appointment Time', {
        required: true,
      });

      expect(field.type).toBe('time');
    });

    it('should build datetime-local field', () => {
      const field = buildField(
        'event',
        'datetime-local',
        'Event Date and Time',
        {
          required: true,
        }
      );

      expect(field.type).toBe('datetime-local');
    });

    it('should not include undefined optional properties', () => {
      const field = buildField('name', 'text', 'Name');

      expect(field.placeholder).toBeUndefined();
      expect(field.validation).toBeUndefined();
      expect(field.options).toBeUndefined();
      expect(field.rows).toBeUndefined();
      expect(field.defaultValue).toBeUndefined();
    });

    it('should handle empty validation object', () => {
      const field = buildField('name', 'text', 'Name', {
        validation: {},
      });

      // Empty validation should not be added
      expect(field.validation).toBeUndefined();
    });

    it('should not add rows to non-textarea fields', () => {
      const field = buildField('name', 'text', 'Name', {
        rows: 5, // Should be ignored for text fields
      });

      expect(field.rows).toBeUndefined();
    });

    it('should not add defaultValue to non-hidden fields', () => {
      const field = buildField('name', 'text', 'Name', {
        defaultValue: 'test', // Should be ignored for non-hidden fields
      });

      expect(field.defaultValue).toBeUndefined();
    });

    it('should not add options to non-select/radio/checkbox fields', () => {
      const field = buildField('name', 'text', 'Name', {
        options: [{ value: 'test', label: 'Test' }], // Should be ignored
      });

      expect(field.options).toBeUndefined();
    });
  });
});
