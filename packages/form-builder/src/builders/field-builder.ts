/**
 * Field Builder - Business logic for creating form fields
 * Decoupled from terminal UI and prompts
 */

import inquirer from 'inquirer';
import type {
  FormField,
  FieldType,
  ValidationRules,
  FieldOption,
} from '@xnok/emma-shared/types';
import {
  getBaseFieldPrompts,
  getTextareaPrompts,
  getOptionPrompts,
  getHiddenFieldPrompts,
  getValidationConfirmPrompt,
  getTextValidationPrompts,
  getNumberValidationPrompts,
} from '../prompts/field-prompts.js';
import { displayOptionAdditionInstructions } from '../ui/console-formatter.js';

/**
 * Create a field interactively using prompts
 */
export async function createFieldInteractive(
  type: FieldType,
  fieldNumber: number
): Promise<FormField> {
  const baseAnswers = await inquirer.prompt(
    getBaseFieldPrompts(fieldNumber, type)
  );

  const field: FormField = {
    id: baseAnswers.id as string,
    type,
    label: baseAnswers.label as string,
    required: (baseAnswers.required as boolean) || false,
  };

  if (baseAnswers.placeholder) {
    field.placeholder = baseAnswers.placeholder as string;
  }

  // Type-specific prompts
  switch (type) {
    case 'textarea': {
      const textareaAnswers = await inquirer.prompt(
        getTextareaPrompts()
      );
      field.rows = textareaAnswers.rows as number;
      break;
    }

    case 'select':
    case 'radio':
    case 'checkbox': {
      const options = await createFieldOptionsInteractive();
      field.options = options;
      break;
    }

    case 'hidden': {
      const hiddenAnswers = await inquirer.prompt(
        getHiddenFieldPrompts()
      );
      field.defaultValue = hiddenAnswers.defaultValue as string;
      break;
    }
  }

  // Validation rules
  if (type !== 'hidden') {
    const validation = await createValidationRulesInteractive(type);
    if (Object.keys(validation).length > 0) {
      field.validation = validation;
    }
  }

  return field;
}

/**
 * Create field options interactively
 */
export async function createFieldOptionsInteractive(): Promise<FieldOption[]> {
  const options: FieldOption[] = [];

  displayOptionAdditionInstructions();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const optionAnswers = await inquirer.prompt(
      getOptionPrompts(options.length + 1)
    );

    const optionValue = optionAnswers.optionValue as string;
    if (!optionValue) break;

    options.push({
      value: optionValue,
      label: (optionAnswers.optionLabel as string) || optionValue,
    });
  }

  return options;
}

/**
 * Create validation rules interactively
 */
export async function createValidationRulesInteractive(
  type: FieldType
): Promise<ValidationRules> {
  const rules: ValidationRules = {};

  let validationPrompts: unknown[] = [];

  // Common validation
  if (type === 'text' || type === 'textarea' || type === 'email') {
    validationPrompts = getTextValidationPrompts();
  }

  // Number validation
  if (type === 'number') {
    validationPrompts = getNumberValidationPrompts();
  }

  if (validationPrompts.length > 0) {
    const { addValidation } = (await inquirer.prompt(
      getValidationConfirmPrompt()
    )) as { addValidation: boolean };

    if (addValidation) {
      const answers = (await inquirer.prompt(validationPrompts)) as Record<
        string,
        string | number | boolean
      >;

      Object.keys(answers).forEach((key) => {
        if (answers[key] != null && answers[key] !== '') {
          (rules as Record<string, string | number | boolean>)[key] =
            answers[key];
        }
      });
    }
  }

  return rules;
}

/**
 * Build a field from data (non-interactive)
 */
export function buildField(
  id: string,
  type: FieldType,
  label: string,
  options?: {
    required?: boolean;
    placeholder?: string;
    rows?: number;
    defaultValue?: string;
    options?: FieldOption[];
    validation?: ValidationRules;
    addedAt?: number;
  }
): FormField {
  const field: FormField = {
    id,
    type,
    label,
    required: options?.required ?? false,
  };

  if (options?.placeholder) {
    field.placeholder = options.placeholder;
  }

  if (options?.rows && type === 'textarea') {
    field.rows = options.rows;
  }

  if (options?.defaultValue && type === 'hidden') {
    field.defaultValue = options.defaultValue;
  }

  if (options?.options && (type === 'select' || type === 'radio' || type === 'checkbox')) {
    field.options = options.options;
  }

  if (options?.validation && Object.keys(options.validation).length > 0) {
    field.validation = options.validation;
  }

  if (options?.addedAt) {
    field.addedAt = options.addedAt;
  }

  return field;
}
