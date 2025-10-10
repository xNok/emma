/**
 * Init Command - Initialize Emma configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { EmmaConfig } from '../config.js';

export function initCommand(config: EmmaConfig): Command {
  return new Command('init')
    .description('Initialize Emma configuration')
    .action(async () => {
      console.log(chalk.cyan('🚀 Initializing Emma Forms CLI...'));
      console.log('');

      if (config.isInitialized()) {
        const { overwrite } = (await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'Emma is already initialized. Overwrite configuration?',
            default: false,
          },
        ])) as { overwrite: boolean };

        if (!overwrite) {
          console.log(chalk.yellow('Initialization cancelled.'));
          return;
        }
      }

      // Configuration prompts
      const answers = (await inquirer.prompt([
        {
          type: 'input',
          name: 'defaultTheme',
          message: 'Default theme for new forms:',
          default: config.get('defaultTheme'),
          validate: (input: string) =>
            input.trim().length > 0 || 'Theme name is required',
        },
        {
          type: 'input',
          name: 'localServerPort',
          message: 'Local server port for previews:',
          default: config.get('localServerPort'),
          validate: (input: string) => {
            const port = parseInt(input, 10);
            if (isNaN(port)) {
              return 'Port must be a number';
            }
            if (port < 1024 || port > 65535) {
              return 'Port must be between 1024 and 65535';
            }
            return true;
          },
          filter: (input: string) => parseInt(input, 10),
        },
        {
          type: 'input',
          name: 'localServerHost',
          message: 'Local server host:',
          default: config.get('localServerHost'),
          validate: (input: string) =>
            input.trim().length > 0 || 'Host is required',
        },
      ])) as {
        defaultTheme: string;
        localServerPort: number;
        localServerHost: string;
      };

      // Update configuration
      config.set('defaultTheme', answers.defaultTheme);
      config.set('localServerPort', answers.localServerPort);
      config.set('localServerHost', answers.localServerHost);

      // Initialize directories and save config
      await config.initialize();

      console.log('');
      console.log(chalk.green('✅ Emma CLI initialized successfully!'));
      console.log('');
      console.log(chalk.cyan('Configuration:'));
      console.log(`  Forms directory: ${config.getFormsDir()}`);
      console.log(`  Builds directory: ${config.getBuildsDir()}`);
      console.log(`  Default theme: ${config.get('defaultTheme')}`);
      console.log(
        `  Local server: http://${config.get('localServerHost')}:${config.get('localServerPort')}`
      );
      console.log('');
      console.log(chalk.cyan('Next steps:'));
      console.log('  $ emma create my-first-form');
      console.log('  $ emma preview my-first-form-001');
    });
}
