/**
 * Delete Command - Delete a form
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { EmmaConfig } from '../config.js';
import { FormSchema } from '@xnok/emma-shared/types';

interface DeleteOptions {
  force?: boolean;
}

export function deleteCommand(config: EmmaConfig): Command {
  return new Command('delete')
    .description('Delete a form')
    .argument('<form-id>', 'Form ID to delete')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(async (formId: string, options: DeleteOptions) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      // Check if form exists
      const schema: FormSchema | null = await config.loadFormSchema(formId);
      if (!schema) {
        console.log(chalk.red(`Form "${formId}" not found.`));
        return;
      }

      // Confirmation prompt unless force flag is used
      if (!options.force) {
        const { confirm } = (await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete form "${formId}" (${schema.name})? This cannot be undone.`,
            default: false,
          },
        ])) as { confirm: boolean };

        if (!confirm) {
          console.log(chalk.yellow('Deletion cancelled.'));
          return;
        }
      }

      try {
        await config.deleteFormSchema(formId);
        console.log(chalk.green(`✅ Form "${formId}" deleted successfully.`));
      } catch (error) {
        console.log(
          chalk.red(
            `❌ Failed to delete form: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
}
