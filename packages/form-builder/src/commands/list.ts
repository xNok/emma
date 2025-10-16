/**
 * List Command - List all forms
 */

import { Command } from 'commander';
import chalk from 'chalk';
import type { EmmaConfig } from '../config.js';
import { FormSchema } from '@xnok/emma-shared/types';

interface ListOptions {
  detailed?: boolean;
}

export function listCommand(config: EmmaConfig): Command {
  return new Command('list')
    .description('List all forms')
    .option('-d, --detailed', 'Show detailed information')
    .action(async (options: ListOptions) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      const formIds = await config.listFormSchemas();

      if (formIds.length === 0) {
        console.log(chalk.yellow('No forms found.'));
        console.log('');
        console.log(chalk.cyan('Create your first form:'));
        console.log('  $ emma create my-form');
        return;
      }

      console.log(chalk.cyan(`📋 Found ${formIds.length} form(s):`));
      console.log('');

      for (const formId of formIds) {
        if (options.detailed) {
          try {
            const schema: FormSchema | null =
              await config.loadFormSchema(formId);
            if (schema) {
              console.log(chalk.green(`📝 ${formId}`));
              console.log(`   Name: ${schema.name}`);
              console.log(`   Theme: ${schema.theme}`);
              console.log(`   Fields: ${schema.fields.length}`);
              console.log(`   Version: ${schema.version}`);
            } else {
              console.log(chalk.red(`❌ ${formId} (schema not found)`));
            }
          } catch (error) {
            console.log(chalk.red(`❌ ${formId} (error loading schema)`));
          }
        } else {
          console.log(`  ${chalk.green('📝')} ${formId}`);
        }
      }

      console.log('');
      console.log(chalk.dim('Use --detailed for more information'));
      console.log(chalk.dim('Commands: build, deploy, preview, delete'));
    });
}
