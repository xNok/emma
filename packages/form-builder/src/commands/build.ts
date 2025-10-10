/**
 * Build Command - Build a form bundle
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { EmmaConfig } from '../config.js';
import { FormBuilder } from '../form-builder.js';

interface BuildOptions {
  watch?: boolean;
}

export function buildCommand(config: EmmaConfig): Command {
  return new Command('build')
    .description('Build a form bundle')
    .argument('<form-id>', 'Form ID to build')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .action(async (formId: string, options: BuildOptions) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      const schema = await config.loadFormSchema(formId);
      if (!schema) {
        console.log(chalk.red(`Form "${formId}" not found.`));
        return;
      }

      const builder = new FormBuilder(config);
      const spinner = ora('Building form bundle...').start();

      try {
        const result = await builder.build(formId, schema);
        spinner.succeed('Form bundle built successfully');

        console.log('');
        console.log(chalk.cyan('Build results:'));
        console.log(`  Bundle: ${result.bundlePath}`);
        console.log(`  Size: ${result.size} bytes`);
        console.log(`  Output: ${result.outputDir}`);
        console.log('');
        console.log(chalk.cyan('Next steps:'));
        console.log(`  $ emma deploy ${formId}`);
        console.log(`  $ emma preview ${formId}`);

        if (options.watch) {
          console.log('');
          console.log(
            chalk.yellow('👀 Watching for changes... (Press Ctrl+C to stop)')
          );

          // TODO: Implement file watching
          console.log(chalk.dim('Watch mode not yet implemented'));
        }
      } catch (error) {
        spinner.fail('Build failed');
        console.log(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });
}
