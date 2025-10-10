#!/usr/bin/env node

/**
 * Emma CLI Entry Point
 * Main command-line interface for the Emma Forms system
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { EmmaConfig } from './config.js';
import { initCommand } from './commands/init.js';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import { buildCommand } from './commands/build.js';
import { deployCommand } from './commands/deploy.js';
import { previewCommand } from './commands/preview.js';
import { deleteCommand } from './commands/delete.js';

const program = new Command();

async function main() {
  try {
    // Load configuration
    const config = new EmmaConfig();
    await config.load();

    program
      .name('emma')
      .description('CLI tool for creating and managing embeddable forms')
      .version('0.1.0');

    // Register commands
    program.addCommand(initCommand(config));
    program.addCommand(createCommand(config));
    program.addCommand(listCommand(config));
    program.addCommand(buildCommand(config));
    program.addCommand(deployCommand(config));
    program.addCommand(previewCommand(config));
    program.addCommand(deleteCommand(config));

    // Enhanced help
    program.on('--help', () => {
      console.log('');
      console.log(chalk.cyan('Examples:'));
      console.log('  $ emma init');
      console.log('  $ emma create contact-form');
      console.log('  $ emma deploy contact-form-001');
      console.log('  $ emma preview contact-form-001');
      console.log('');
    });

    await program.parseAsync();
  } catch (error) {
    console.error(
      chalk.red('Error:'),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
