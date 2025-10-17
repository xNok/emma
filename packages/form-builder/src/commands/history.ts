/**
 * History Command - Display form snapshot history
 */

import { Command } from 'commander';
import chalk from 'chalk';
import type { EmmaConfig } from '../config.js';
import type { FormSchema } from '@xnok/emma-shared/types';

export function historyCommand(config: EmmaConfig): Command {
  return new Command('history')
    .description('View snapshot history for a form')
    .argument('<form-id>', 'Form ID to view history for')
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

      if (!schema.snapshots || schema.snapshots.length === 0) {
        console.log(
          chalk.yellow(`No snapshot history found for "${formId}".`)
        );
        console.log(
          chalk.dim('This form may have been created before snapshot tracking was added.')
        );
        return;
      }

      console.log('');
      console.log(chalk.cyan.bold(`📜 Snapshot History for "${schema.name}"`));
      console.log(chalk.dim(`Form ID: ${formId}`));
      console.log('');

      // Sort snapshots by timestamp (newest first)
      const sortedSnapshots = [...schema.snapshots].sort(
        (a, b) => b.timestamp - a.timestamp
      );

      sortedSnapshots.forEach((snapshot, index) => {
        const date = new Date(snapshot.timestamp * 1000);
        const isCurrent = snapshot.timestamp === schema.currentSnapshot;
        const isDeployed = snapshot.deployed;

        // Header with status indicators
        const statusIndicators = [];
        if (isCurrent) statusIndicators.push(chalk.green('● CURRENT'));
        if (isDeployed) statusIndicators.push(chalk.blue('✓ DEPLOYED'));

        const header = statusIndicators.length > 0
          ? `${chalk.bold(`Snapshot ${sortedSnapshots.length - index}`)} ${statusIndicators.join(' ')}`
          : chalk.bold(`Snapshot ${sortedSnapshots.length - index}`);

        console.log(header);
        console.log(chalk.dim(`  Timestamp: ${snapshot.timestamp}`));
        console.log(chalk.dim(`  Date: ${date.toLocaleString()}`));
        console.log(chalk.dim(`  Bundle: ${snapshot.r2Key}`));
        console.log(`  Changes: ${snapshot.changes}`);
        console.log('');
      });

      console.log(chalk.cyan('Commands:'));
      console.log(
        `  $ emma build ${formId} --snapshot <timestamp>      # Build a specific snapshot`
      );
      console.log(
        `  $ emma deploy ${formId} --snapshot <timestamp>     # Deploy a specific snapshot`
      );
      console.log('');
    });
}
