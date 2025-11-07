/**
 * Console Output Formatter - Terminal UI formatting utilities
 * Separates presentation logic from business logic
 */

import chalk from 'chalk';
import type { FormSchema, FormField } from '@xnok/emma-shared/types';

/**
 * Display form creation header
 */
export function displayCreateFormHeader(): void {
  console.log(chalk.cyan('📝 Creating a new form...'));
  console.log('');
}

/**
 * Display field addition instructions
 */
export function displayFieldAdditionInstructions(): void {
  console.log('');
  console.log(chalk.cyan('📋 Adding form fields...'));
  console.log(
    chalk.dim('Tip: Press Enter without selecting a field type when done')
  );
  console.log('');
}

/**
 * Display option addition instructions
 */
export function displayOptionAdditionInstructions(): void {
  console.log(
    chalk.dim('Add options (press Enter with empty value when done):')
  );
}

/**
 * Display field added confirmation
 */
export function displayFieldAdded(field: FormField): void {
  console.log(chalk.green(`✅ Added field: ${field.label} (${field.type})`));
}

/**
 * Display form creation success
 */
export function displayFormCreated(schema: FormSchema): void {
  console.log('');
  console.log(chalk.green('🎉 Form created successfully!'));
  console.log('');
  console.log(chalk.cyan('Form Details:'));
  console.log(`  ID: ${schema.formId}`);
  console.log(`  Name: ${schema.name}`);
  console.log(`  Theme: ${schema.theme}`);
  console.log(`  Fields: ${schema.fields.length}`);
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  console.log(`  $ emma build ${schema.formId}      # Build the form bundle`);
  console.log(`  $ emma deploy ${schema.formId}     # Deploy to local server`);
  console.log(`  $ emma preview ${schema.formId}    # Open in browser`);
}

/**
 * Display form edit header
 */
export function displayEditFormHeader(schema: FormSchema): void {
  console.log('');
  console.log(chalk.cyan.bold(`✏️  Editing "${schema.name}"`));
  console.log(chalk.dim(`Form ID: ${schema.formId}`));
  console.log('');
}

/**
 * Display field adding section
 */
export function displayAddFieldSection(): void {
  console.log('');
  console.log(chalk.cyan('➕ Adding a new field'));
}

/**
 * Display current fields
 */
export function displayFields(schema: FormSchema): void {
  console.log('');
  console.log(chalk.cyan.bold('Current Fields:'));
  if (schema.fields.length === 0) {
    console.log(chalk.dim('  No fields yet'));
  } else {
    schema.fields.forEach((field, index) => {
      const requiredBadge = field.required ? chalk.red('*') : ' ';
      console.log(
        `  ${index + 1}. ${requiredBadge} ${field.label} (${field.id}) - ${field.type}`
      );
    });
  }
  console.log('');
}

/**
 * Display error message
 */
export function displayError(message: string): void {
  console.log(chalk.red(`Error: ${message}`));
}

/**
 * Display warning message
 */
export function displayWarning(message: string): void {
  console.log(chalk.yellow(message));
}

/**
 * Display info message
 */
export function displayInfo(message: string): void {
  console.log(chalk.cyan(message));
}

/**
 * Display success message
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green(message));
}

/**
 * Display not initialized error
 */
export function displayNotInitializedError(): void {
  console.log(chalk.red('Emma is not initialized. Run "emma init" first.'));
}

/**
 * Display form not found error
 */
export function displayFormNotFound(formId: string): void {
  console.log(chalk.red(`Form "${formId}" not found.`));
}

/**
 * Display minimum fields error
 */
export function displayMinimumFieldsError(): void {
  console.log(chalk.red('At least one field is required.'));
}

/**
 * Display form save error
 */
export function displayFormSaveError(error: unknown): void {
  console.log(
    chalk.red(
      `Error saving form: ${error instanceof Error ? error.message : String(error)}`
    )
  );
}

/**
 * Display editing cancelled
 */
export function displayEditingCancelled(): void {
  console.log(chalk.yellow('Editing cancelled.'));
}

/**
 * Display no changes to save
 */
export function displayNoChanges(): void {
  console.log(chalk.yellow('No changes to save.'));
}
