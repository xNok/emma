/**
 * Create Command - Interactive form creation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { EmmaConfig } from '../config.js';
import type {
  FormSchema,
  FormField,
  FieldType,
  ValidationRules,
} from '@emma/shared/types';

interface InquirerPrompt {
  type: string;
  name: string;
  message: string;
  default?: unknown;
  validate?: (input: string) => boolean | string;
  choices?: (string | { name: string; value: string })[];
}

interface BasicFormInfo {
  formName: string;
  theme: string;
}

interface FormOptions {
  submitButtonText: string;
  successMessage: string;
}

interface FieldAnswer {
  id: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

interface TextareaAnswer extends FieldAnswer {
  rows: number;
}

interface SelectAnswer extends FieldAnswer {
  defaultValue?: string;
}

// Available field types
const FIELD_TYPES: { name: string; value: FieldType; description: string }[] = [
  { name: 'Text Input', value: 'text', description: 'Single-line text field' },
  {
    name: 'Email',
    value: 'email',
    description: 'Email address with validation',
  },
  { name: 'Textarea', value: 'textarea', description: 'Multi-line text field' },
  { name: 'Number', value: 'number', description: 'Numeric input' },
  { name: 'Phone', value: 'tel', description: 'Phone number' },
  { name: 'URL', value: 'url', description: 'Website URL' },
  {
    name: 'Select Dropdown',
    value: 'select',
    description: 'Dropdown selection',
  },
  {
    name: 'Radio Buttons',
    value: 'radio',
    description: 'Single choice from options',
  },
  { name: 'Checkboxes', value: 'checkbox', description: 'Multiple selections' },
  { name: 'Date', value: 'date', description: 'Date picker' },
  { name: 'Time', value: 'time', description: 'Time picker' },
  {
    name: 'Date & Time',
    value: 'datetime-local',
    description: 'Date and time picker',
  },
  {
    name: 'Hidden Field',
    value: 'hidden',
    description: 'Hidden value (for tracking)',
  },
];

const THEMES = [
  { name: 'Default', value: 'default', description: 'Clean, modern styling' },
  {
    name: 'Minimal',
    value: 'minimal',
    description: 'Minimal, borderless design',
  },
];

export function createCommand(config: EmmaConfig): Command {
  return new Command('create')
    .description('Create a new form interactively')
    .argument('[form-name]', 'Base name for the form')
    .action(async (formName?: string) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      console.log(chalk.cyan('📝 Creating a new form...'));
      console.log('');

      // Basic form information
      const basicInfo = (await inquirer.prompt([
        {
          type: 'input',
          name: 'formName',
          message: 'Form display name:',
          default: formName || 'My Form',
          validate: (input: string) =>
            input.trim().length > 0 || 'Form name is required',
        },
        {
          type: 'list',
          name: 'theme',
          message: 'Select a theme:',
          choices: THEMES,
          default: config.get('defaultTheme'),
        },
        {
          type: 'input',
          name: 'submitButtonText',
          message: 'Submit button text:',
          default: 'Submit',
        },
        {
          type: 'input',
          name: 'successMessage',
          message: 'Success message:',
          default: 'Thank you for your submission!',
        },
      ])) as BasicFormInfo & FormOptions;

      // Generate unique form ID
      const baseId =
        formName ||
        basicInfo.formName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const timestamp = Date.now().toString().slice(-3);
      const formId = `${baseId}-${timestamp}`;

      console.log('');
      console.log(chalk.cyan('📋 Adding form fields...'));
      console.log(
        chalk.dim('Tip: Press Enter without selecting a field type when done')
      );
      console.log('');

      const fields: FormField[] = [];
      let addingFields = true;

      while (addingFields) {
        const fieldChoices = [
          ...FIELD_TYPES,
          new inquirer.Separator(),
          { name: '✅ Done adding fields', value: '__done__', description: '' },
        ];

        const { fieldType } = (await inquirer.prompt([
          {
            type: 'list',
            name: 'fieldType',
            message: `Add field ${fields.length + 1}:`,
            choices: fieldChoices,
            pageSize: 15,
          },
        ])) as { fieldType: FieldType | '__done__' };

        if (fieldType === '__done__') {
          addingFields = false;
          continue;
        }

        const field = await createField(
          fieldType as FieldType,
          fields.length + 1
        );
        fields.push(field);

        console.log(
          chalk.green(`✅ Added field: ${field.label} (${field.type})`)
        );
      }

      if (fields.length === 0) {
        console.log(chalk.red('At least one field is required.'));
        return;
      }

      // Honeypot settings
      const { enableHoneypot } = (await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableHoneypot',
          message: 'Enable spam protection (honeypot)?',
          default: true,
        },
      ])) as { enableHoneypot: boolean };

      // Create form schema
      const schema: FormSchema = {
        formId,
        name: basicInfo.formName,
        version: '1.0.0',
        theme: basicInfo.theme,
        apiEndpoint: `http://localhost:${config.get('localServerPort')}/api/submit/${formId}`,
        fields,
        settings: {
          submitButtonText: basicInfo.submitButtonText,
          successMessage: basicInfo.successMessage,
          errorMessage:
            'There was an error submitting your form. Please try again.',
          honeypot: {
            enabled: enableHoneypot,
            fieldName: 'website', // Common honeypot field name
          },
        },
      };

      // Save form schema
      try {
        await config.saveFormSchema(formId, schema);

        console.log('');
        console.log(chalk.green('🎉 Form created successfully!'));
        console.log('');
        console.log(chalk.cyan('Form Details:'));
        console.log(`  ID: ${formId}`);
        console.log(`  Name: ${schema.name}`);
        console.log(`  Theme: ${schema.theme}`);
        console.log(`  Fields: ${fields.length}`);
        console.log('');
        console.log(chalk.cyan('Next steps:'));
        console.log(`  $ emma build ${formId}      # Build the form bundle`);
        console.log(`  $ emma deploy ${formId}     # Deploy to local server`);
        console.log(`  $ emma preview ${formId}    # Open in browser`);
      } catch (error) {
        console.log(
          chalk.red(
            `Error saving form: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });
}

async function createField(
  type: FieldType,
  fieldNumber: number
): Promise<FormField> {
  const basePrompts: InquirerPrompt[] = [
    {
      type: 'input',
      name: 'label',
      message: 'Field label:',
      default: `Field ${fieldNumber}`,
      validate: (input: string) =>
        input.trim().length > 0 || 'Label is required',
    },
    {
      type: 'input',
      name: 'id',
      message: 'Field ID:',
      default: (answers: Record<string, unknown>) => {
        const label = answers.label as string;
        return label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      },
      validate: (input: string) =>
        /^[a-z][a-z0-9_]*$/.test(input) ||
        'ID must start with letter and contain only letters, numbers, and underscores',
    },
  ];

  if (type !== 'hidden') {
    basePrompts.push(
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

  const baseAnswers = (await inquirer.prompt(basePrompts)) as FieldAnswer;

  const field: FormField = {
    id: baseAnswers.id,
    type,
    label: baseAnswers.label,
    required: baseAnswers.required || false,
  };

  if (baseAnswers.placeholder) {
    field.placeholder = baseAnswers.placeholder;
  }

  // Type-specific prompts
  switch (type) {
    case 'textarea': {
      const textareaAnswers = (await inquirer.prompt([
        {
          type: 'input',
          name: 'rows',
          message: 'Number of rows:',
          default: 4,
          validate: (input: string) => {
            const value = Number(input);
            return Number.isInteger(value) && value > 0
              ? true
              : 'Rows must be a positive integer';
          },
          filter: (input: string) => Number(input),
        },
      ])) as TextareaAnswer;
      field.rows = textareaAnswers.rows;
      break;
    }

    case 'select':
    case 'radio':
    case 'checkbox': {
      const options = await createFieldOptions();
      field.options = options;
      break;
    }

    case 'hidden': {
      const hiddenAnswers = (await inquirer.prompt([
        {
          type: 'input',
          name: 'defaultValue',
          message: 'Hidden value:',
          validate: (input: string) =>
            input.trim().length > 0 || 'Value is required for hidden fields',
        },
      ])) as SelectAnswer;
      field.defaultValue = hiddenAnswers.defaultValue;
      break;
    }
  }

  // Validation rules
  if (type !== 'hidden') {
    const validation = await createValidationRules(type);
    if (Object.keys(validation).length > 0) {
      field.validation = validation;
    }
  }

  return field;
}

async function createFieldOptions() {
  const options = [];
  console.log(
    chalk.dim('Add options (press Enter with empty value when done):')
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const optionAnswers = (await inquirer.prompt([
      {
        type: 'input',
        name: 'optionValue',
        message: `Option ${options.length + 1} value:`,
      },
      {
        type: 'input',
        name: 'optionLabel',
        message: 'Option label:',
        when: (answers: Record<string, unknown>) => !!answers.optionValue,
        default: (answers: Record<string, unknown>) =>
          answers.optionValue as string,
      },
    ])) as { optionValue: string; optionLabel?: string };

    if (!optionAnswers.optionValue) break;

    options.push({
      value: optionAnswers.optionValue,
      label: optionAnswers.optionLabel || optionAnswers.optionValue,
    });
  }

  return options;
}

async function createValidationRules(
  type: FieldType
): Promise<ValidationRules> {
  const rules: ValidationRules = {};

  const validationPrompts = [];

  // Common validation
  if (type === 'text' || type === 'textarea' || type === 'email') {
    validationPrompts.push(
      {
        type: 'number',
        name: 'minLength',
        message: 'Minimum length (optional):',
        validate: (input: number) =>
          !input || input >= 0 || 'Must be non-negative',
      },
      {
        type: 'number',
        name: 'maxLength',
        message: 'Maximum length (optional):',
        validate: (input: number) => !input || input > 0 || 'Must be positive',
      }
    );
  }

  // Number validation
  if (type === 'number') {
    validationPrompts.push(
      {
        type: 'number',
        name: 'min',
        message: 'Minimum value (optional):',
      },
      {
        type: 'number',
        name: 'max',
        message: 'Maximum value (optional):',
      }
    );
  }

  if (validationPrompts.length > 0) {
    const { addValidation } = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addValidation',
        message: 'Add validation rules?',
        default: false,
      },
    ])) as { addValidation: boolean };

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
