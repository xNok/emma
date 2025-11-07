/**
 * Console Formatter Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as formatter from '../ui/console-formatter';
import type { FormSchema, FormField } from '@xnok/emma-shared/types';

describe('Console Formatter', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('displayCreateFormHeader', () => {
    it('should display create form header', () => {
      formatter.displayCreateFormHeader();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayFieldAdditionInstructions', () => {
    it('should display field addition instructions', () => {
      formatter.displayFieldAdditionInstructions();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayOptionAdditionInstructions', () => {
    it('should display option addition instructions', () => {
      formatter.displayOptionAdditionInstructions();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayFieldAdded', () => {
    it('should display field added confirmation', () => {
      const field: FormField = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      };

      formatter.displayFieldAdded(field);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayFormCreated', () => {
    it('should display form created success message', () => {
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
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
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thank you!',
          errorMessage: 'Error occurred',
          honeypot: {
            enabled: true,
            fieldName: 'website',
          },
        },
      };

      formatter.displayFormCreated(schema);
      expect(consoleSpy).toHaveBeenCalled();
      // Check that important information is displayed
      expect(
        consoleSpy.mock.calls.some((call) =>
          call.some(
            (arg) => typeof arg === 'string' && arg.includes('test-form')
          )
        )
      ).toBe(true);
    });
  });

  describe('displayEditFormHeader', () => {
    it('should display edit form header', () => {
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [],
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thank you!',
          errorMessage: 'Error occurred',
          honeypot: {
            enabled: true,
            fieldName: 'website',
          },
        },
      };

      formatter.displayEditFormHeader(schema);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayAddFieldSection', () => {
    it('should display add field section', () => {
      formatter.displayAddFieldSection();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayFields', () => {
    it('should display current fields', () => {
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
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
            required: false,
          },
        ],
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thank you!',
          errorMessage: 'Error occurred',
          honeypot: {
            enabled: true,
            fieldName: 'website',
          },
        },
      };

      formatter.displayFields(schema);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should display message when no fields', () => {
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [],
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thank you!',
          errorMessage: 'Error occurred',
          honeypot: {
            enabled: true,
            fieldName: 'website',
          },
        },
      };

      formatter.displayFields(schema);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayError', () => {
    it('should display error message', () => {
      formatter.displayError('Something went wrong');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayWarning', () => {
    it('should display warning message', () => {
      formatter.displayWarning('This is a warning');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayInfo', () => {
    it('should display info message', () => {
      formatter.displayInfo('This is information');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displaySuccess', () => {
    it('should display success message', () => {
      formatter.displaySuccess('Operation successful');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayNotInitializedError', () => {
    it('should display not initialized error', () => {
      formatter.displayNotInitializedError();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayFormNotFound', () => {
    it('should display form not found error', () => {
      formatter.displayFormNotFound('test-form');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayMinimumFieldsError', () => {
    it('should display minimum fields error', () => {
      formatter.displayMinimumFieldsError();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayFormSaveError', () => {
    it('should display form save error with Error object', () => {
      const error = new Error('Save failed');
      formatter.displayFormSaveError(error);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should display form save error with string', () => {
      formatter.displayFormSaveError('Save failed');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayEditingCancelled', () => {
    it('should display editing cancelled message', () => {
      formatter.displayEditingCancelled();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('displayNoChanges', () => {
    it('should display no changes message', () => {
      formatter.displayNoChanges();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
