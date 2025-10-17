/**
 * Build Command - Build a form bundle
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { EmmaConfig } from '../config.js';
import { FormBuilder } from '../form-builder.js';
import { FormSchema } from '@xnok/emma-shared/types';

interface BuildOptions {
  watch?: boolean;
  snapshot?: string; // Snapshot timestamp to build
}

export function buildCommand(config: EmmaConfig): Command {
  return new Command('build')
    .description('Build a form bundle')
    .argument('<form-id>', 'Form ID to build')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .option(
      '-s, --snapshot <timestamp>',
      'Build a specific snapshot by timestamp'
    )
    .action(async (formId: string, options: BuildOptions) => {
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

      // Validate snapshot if specified
      let snapshotTimestamp: number | undefined;
      if (options.snapshot) {
        snapshotTimestamp = parseInt(options.snapshot, 10);
        if (isNaN(snapshotTimestamp)) {
          console.log(chalk.red('Invalid snapshot timestamp.'));
          return;
        }

        // Check if snapshot exists
        const snapshotExists = schema.snapshots?.some(
          (s) => s.timestamp === snapshotTimestamp
        );
        if (!snapshotExists) {
          console.log(
            chalk.red(
              `Snapshot ${snapshotTimestamp} not found. Use "emma history ${formId}" to see available snapshots.`
            )
          );
          return;
        }
      }

      const builder = new FormBuilder(config);
      const spinner = ora('Building form bundle...').start();

      try {
        const result = await builder.build(formId, schema, snapshotTimestamp);
        spinner.succeed('Form bundle built successfully');

        console.log('');
        console.log(chalk.cyan('Build results:'));
        console.log(`  Bundle: ${result.bundlePath}`);
        console.log(`  Size: ${result.size} bytes`);
        console.log(`  Output: ${result.outputDir}`);
        if (snapshotTimestamp) {
          console.log(
            chalk.dim(`  Snapshot: ${new Date(snapshotTimestamp * 1000).toISOString()}`)
          );
        }
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
