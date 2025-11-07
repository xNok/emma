/**
 * Create Command - Interactive form creation
 * Refactored for better separation of concerns
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import type { EmmaConfig } from '../config.js';
import type { FormField, FieldType } from '@xnok/emma-shared/types';
import { FIELD_TYPES, THEMES } from '../constants.js';
import { createFieldInteractive } from '../builders/field-builder.js';
import { buildFormSchema, generateFormId } from '../builders/schema-builder.js';
import {
  displayNotInitializedError,
  displayCreateFormHeader,
  displayFieldAdditionInstructions,
  displayFieldAdded,
  displayFormCreated,
  displayMinimumFieldsError,
  displayFormSaveError,
} from '../ui/console-formatter.js';

interface BasicFormInfo {
  formName: string;
  theme: string;
}

interface FormOptions {
  submitButtonText: string;
  successMessage: string;
}

export function createCommand(config: EmmaConfig): Command {
  return new Command('create')
    .description('Create a new form interactively')
    .argument('[form-name]', 'Base name for the form')
    .action(async (formName?: string) => {
      if (!config.isInitialized()) {
        displayNotInitializedError();
        return;
      }

      displayCreateFormHeader();

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
      const baseId = formName || basicInfo.formName;
      const formId = generateFormId(baseId);

      displayFieldAdditionInstructions();

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

        const field = await createFieldInteractive(
          fieldType as FieldType,
          fields.length + 1
        );
        fields.push(field);

        displayFieldAdded(field);
      }

      if (fields.length === 0) {
        displayMinimumFieldsError();
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

      // Create form schema using builder
      const schema = buildFormSchema({
        formId,
        name: basicInfo.formName,
        theme: basicInfo.theme,
        apiEndpoint: `http://localhost:${config.get('localServerPort')}/api/submit/${formId}`,
        fields,
        submitButtonText: basicInfo.submitButtonText,
        successMessage: basicInfo.successMessage,
        honeypot: {
          enabled: enableHoneypot,
          fieldName: 'website',
        },
      });

      // Save form schema
      try {
        await config.saveFormSchema(formId, schema);
        displayFormCreated(schema);
      } catch (error) {
        displayFormSaveError(error);
        process.exit(1);
      }
    });
}
