/**
 * Field Prompts - Reusable inquirer prompts for field creation
 */

import type { FieldType } from '@xnok/emma-shared/types';

export interface FieldPromptAnswers {
  label: string;
  id: string;
  placeholder?: string;
  required: boolean;
}

export interface TextareaAnswers extends FieldPromptAnswers {
  rows: number;
}

export interface SelectOptionAnswers {
  optionValue: string;
  optionLabel?: string;
}

export interface HiddenFieldAnswers {
  defaultValue: string;
}

interface PromptQuestion {
  type: string;
  name: string;
  message: string;
  default?: unknown;
  validate?: (input: unknown) => boolean | string;
  when?: (answers: Record<string, unknown>) => boolean;
  filter?: (input: string) => unknown;
}

/**
 * Get base field prompts (label, id, placeholder, required)
 */
export function getBaseFieldPrompts(
  fieldNumber: number,
  type: FieldType
): PromptQuestion[] {
  const prompts: PromptQuestion[] = [
    {
      type: 'input',
      name: 'label',
      message: 'Field label:',
      default: `Field ${fieldNumber}`,
      validate: (input: unknown) =>
        (input as string).trim().length > 0 || 'Label is required',
    },
    {
      type: 'input',
      name: 'id',
      message: 'Field ID:',
      default: (answers: Record<string, unknown>) => {
        const label = answers.label as string;
        return label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      },
      validate: (input: unknown) =>
        /^[a-z][a-z0-9_]*$/.test(input as string) ||
        'ID must start with letter and contain only letters, numbers, and underscores',
    },
  ];

  if (type !== 'hidden') {
    prompts.push(
      {
        type: 'input',
        name: 'placeholder',
        message: 'Placeholder text (optional):',
      },
      {
        type: 'confirm',
        name: 'required',
        message: 'Required field?',
        default: true,
      }
    );
  }

  return prompts;
}

/**
 * Get textarea-specific prompts
 */
export function getTextareaPrompts(): PromptQuestion[] {
  return [
    {
      type: 'input',
      name: 'rows',
      message: 'Number of rows:',
      default: 4,
      validate: (input: unknown) => {
        const value = Number(input);
        return Number.isInteger(value) && value > 0
          ? true
          : 'Rows must be a positive integer';
      },
      filter: (input: string) => Number(input),
    },
  ];
}

/**
 * Get prompts for creating field options (select, radio, checkbox)
 */
export function getOptionPrompts(optionCount: number): PromptQuestion[] {
  return [
    {
      type: 'input',
      name: 'optionValue',
      message: `Option ${optionCount} value:`,
    },
    {
      type: 'input',
      name: 'optionLabel',
      message: 'Option label:',
      when: (answers: Record<string, unknown>) => !!answers.optionValue,
      default: (answers: Record<string, unknown>) =>
        answers.optionValue as string,
    },
  ];
}

/**
 * Get hidden field prompts
 */
export function getHiddenFieldPrompts(): PromptQuestion[] {
  return [
    {
      type: 'input',
      name: 'defaultValue',
      message: 'Hidden value:',
      validate: (input: unknown) =>
        (input as string).trim().length > 0 || 'Value is required for hidden fields',
    },
  ];
}

/**
 * Prompt for adding validation rules
 */
export function getValidationConfirmPrompt(): PromptQuestion[] {
  return [
    {
      type: 'confirm',
      name: 'addValidation',
      message: 'Add validation rules?',
      default: false,
    },
  ];
}

/**
 * Get validation prompts for text-based fields
 */
export function getTextValidationPrompts(): PromptQuestion[] {
  return [
    {
      type: 'number',
      name: 'minLength',
      message: 'Minimum length (optional):',
      validate: (input: unknown) =>
        !input || (input as number) >= 0 || 'Must be non-negative',
    },
    {
      type: 'number',
      name: 'maxLength',
      message: 'Maximum length (optional):',
      validate: (input: unknown) => !input || (input as number) > 0 || 'Must be positive',
    },
  ];
}

/**
 * Get validation prompts for number fields
 */
export function getNumberValidationPrompts(): PromptQuestion[] {
  return [
    {
      type: 'number',
      name: 'min',
      message: 'Minimum value (optional):',
    },
    {
      type: 'number',
      name: 'max',
      message: 'Maximum value (optional):',
    },
  ];
}
