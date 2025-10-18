/**
 * Edit Command - Interactive form editing with snapshot creation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { EmmaConfig } from '../config.js';
import type { FormSchema, FormField, FieldType } from '@xnok/emma-shared/types';
import { FIELD_TYPES } from '../constants.js';

export function editCommand(config: EmmaConfig): Command {
  return new Command('edit')
    .description('Edit a form interactively (creates new snapshot)')
    .argument('<form-id>', 'Form ID to edit')
    .action(async (formId: string) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      const schema: FormSchema | null = await config.loadFormSchema(formId);
      if (!schema) {
        console.log(chalk.red(`Form "${formId}" not found.`));
        return;
      }

      console.log('');
      console.log(chalk.cyan.bold(`✏️  Editing "${schema.name}"`));
      console.log(chalk.dim(`Form ID: ${formId}`));
      console.log('');

      let editing = true;
      let hasChanges = false;
      const changeDescriptions: string[] = [];

      while (editing) {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '➕ Add a new field', value: 'add' },
              { name: '✏️  Edit an existing field', value: 'edit' },
              { name: '🗑️  Remove a field', value: 'remove' },
              { name: '📋 View current fields', value: 'view' },
              new inquirer.Separator(),
              { name: '💾 Save changes and create snapshot', value: 'save' },
              { name: '❌ Cancel without saving', value: 'cancel' },
            ],
          },
        ]);

        switch (action) {
          case 'add':
            await addField(schema, changeDescriptions);
            hasChanges = true;
            break;
          case 'edit':
            await editField(schema, changeDescriptions);
            hasChanges = true;
            break;
          case 'remove':
            await removeField(schema, changeDescriptions);
            hasChanges = true;
            break;
          case 'view':
            viewFields(schema);
            break;
          case 'save':
            if (hasChanges) {
              await saveWithSnapshot(config, formId, schema, changeDescriptions);
            } else {
              console.log(chalk.yellow('No changes to save.'));
            }
            editing = false;
            break;
          case 'cancel':
            console.log(chalk.yellow('Editing cancelled.'));
            editing = false;
            break;
        }
      }
    });
}

async function addField(schema: FormSchema, changeDescriptions: string[]) {
  console.log('');
  console.log(chalk.cyan('➕ Adding a new field'));

  const { fieldType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fieldType',
      message: 'Select field type:',
      choices: FIELD_TYPES,
    },
  ]);

  const { id, label, placeholder, required } = await inquirer.prompt([
    {
      type: 'input',
      name: 'label',
      message: 'Field label:',
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
      validate: (input: string) => {
        if (!/^[a-z][a-z0-9_]*$/.test(input)) {
          return 'ID must start with letter and contain only letters, numbers, and underscores';
        }
        if (schema.fields.some((f) => f.id === input)) {
          return 'Field ID already exists';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'placeholder',
      message: 'Placeholder text (optional):',
      when: () => fieldType !== 'hidden',
    },
    {
      type: 'confirm',
      name: 'required',
      message: 'Required field?',
      default: true,
      when: () => fieldType !== 'hidden',
    },
  ]);

  const newField: FormField = {
    id,
    type: fieldType,
    label,
    required: required || false,
    addedAt: Math.floor(Date.now() / 1000),
  };

  if (placeholder) {
    newField.placeholder = placeholder;
  }

  schema.fields.push(newField);
  changeDescriptions.push(`Added field "${label}" (${fieldType})`);
  console.log(chalk.green(`✓ Field "${label}" added`));
}

async function editField(schema: FormSchema, changeDescriptions: string[]) {
  if (schema.fields.length === 0) {
    console.log(chalk.yellow('No fields to edit.'));
    return;
  }

  const { fieldId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fieldId',
      message: 'Select field to edit:',
      choices: schema.fields.map((f) => ({
        name: `${f.label} (${f.id} - ${f.type})`,
        value: f.id,
      })),
    },
  ]);

  const field = schema.fields.find((f) => f.id === fieldId);
  if (!field) return;

  const { property } = await inquirer.prompt([
    {
      type: 'list',
      name: 'property',
      message: 'What would you like to edit?',
      choices: [
        { name: 'Label', value: 'label' },
        { name: 'Placeholder', value: 'placeholder' },
        { name: 'Required', value: 'required' },
        { name: 'Back', value: 'back' },
      ],
    },
  ]);

  if (property === 'back') return;

  if (property === 'label') {
    const { newLabel } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newLabel',
        message: 'New label:',
        default: field.label,
        validate: (input: string) =>
          input.trim().length > 0 || 'Label is required',
      },
    ]);
    const oldLabel = field.label;
    field.label = newLabel;
    changeDescriptions.push(`Updated "${oldLabel}" label to "${newLabel}"`);
    console.log(chalk.green(`✓ Label updated`));
  } else if (property === 'placeholder') {
    const { newPlaceholder } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newPlaceholder',
        message: 'New placeholder:',
        default: field.placeholder || '',
      },
    ]);
    field.placeholder = newPlaceholder || undefined;
    changeDescriptions.push(`Updated "${field.label}" placeholder`);
    console.log(chalk.green(`✓ Placeholder updated`));
  } else if (property === 'required') {
    const { newRequired } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'newRequired',
        message: 'Required field?',
        default: field.required || false,
      },
    ]);
    field.required = newRequired;
    changeDescriptions.push(
      `Set "${field.label}" to ${newRequired ? 'required' : 'optional'}`
    );
    console.log(chalk.green(`✓ Required status updated`));
  }
}

async function removeField(schema: FormSchema, changeDescriptions: string[]) {
  if (schema.fields.length === 0) {
    console.log(chalk.yellow('No fields to remove.'));
    return;
  }

  const { fieldId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fieldId',
      message: 'Select field to remove:',
      choices: schema.fields.map((f) => ({
        name: `${f.label} (${f.id} - ${f.type})`,
        value: f.id,
      })),
    },
  ]);

  const field = schema.fields.find((f) => f.id === fieldId);
  if (!field) return;

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove field "${field.label}"? This cannot be undone.`,
      default: false,
    },
  ]);

  if (confirm) {
    schema.fields = schema.fields.filter((f) => f.id !== fieldId);
    changeDescriptions.push(`Removed field "${field.label}"`);
    console.log(chalk.green(`✓ Field "${field.label}" removed`));
  }
}

function viewFields(schema: FormSchema) {
  console.log('');
  console.log(chalk.cyan.bold('Current Fields:'));
  if (schema.fields.length === 0) {
    console.log(chalk.dim('  No fields'));
  } else {
    schema.fields.forEach((field, index) => {
      const required = field.required ? chalk.red('*') : '';
      console.log(
        `  ${index + 1}. ${field.label}${required} (${chalk.dim(field.id)} - ${chalk.dim(field.type)})`
      );
      if (field.placeholder) {
        console.log(chalk.dim(`     Placeholder: ${field.placeholder}`));
      }
    });
  }
  console.log('');
}

async function saveWithSnapshot(
  config: EmmaConfig,
  formId: string,
  schema: FormSchema,
  changeDescriptions: string[]
) {
  console.log('');
  console.log(chalk.cyan('💾 Saving changes...'));

  const { changesSummary } = await inquirer.prompt([
    {
      type: 'input',
      name: 'changesSummary',
      message: 'Describe the changes (for snapshot history):',
      default: changeDescriptions.join(', '),
      validate: (input: string) =>
        input.trim().length > 0 || 'Change description is required',
    },
  ]);

  const now = Math.floor(Date.now() / 1000);

  // Initialize snapshots array if it doesn't exist
  if (!schema.snapshots) {
    schema.snapshots = [];
  }

  // Create new snapshot
  const newSnapshot = {
    timestamp: now,
    r2Key: `${formId}-${now}.js`,
    changes: changesSummary,
    deployed: false,
  };

  schema.snapshots.push(newSnapshot);
  schema.currentSnapshot = now;
  schema.lastModified = now;

  // Initialize createdAt if it doesn't exist
  if (!schema.createdAt) {
    schema.createdAt = now;
  }

  await config.saveFormSchema(formId, schema);

  console.log('');
  console.log(chalk.green('✅ Changes saved successfully!'));
  console.log('');
  console.log(chalk.cyan('Snapshot Details:'));
  console.log(`  Timestamp: ${now}`);
  console.log(`  Date: ${new Date(now * 1000).toLocaleString()}`);
  console.log(`  Bundle: ${newSnapshot.r2Key}`);
  console.log(`  Changes: ${changesSummary}`);
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  console.log(`  $ emma build ${formId}        # Build the new snapshot`);
  console.log(`  $ emma deploy ${formId}       # Deploy the changes`);
  console.log(`  $ emma history ${formId}      # View snapshot history`);
  console.log('');
}
