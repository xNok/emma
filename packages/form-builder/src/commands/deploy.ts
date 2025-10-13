/**
 * Deploy Command - Target selection via prompt or --target flag
 */

import { Command } from 'commander';
import chalk from 'chalk';
import type { EmmaConfig } from '../config.js';
import {
  getDefaultProvider,
  getDeploymentProviders,
} from '../deployment/index.js';

// No provider-specific types here; providers register their own flags

export function deployCommand(config: EmmaConfig): Command {
  const cmd = new Command('deploy').description(
    'Deploy a form to a target environment'
  );

  // Main deploy command with target selection
  cmd
    .argument('<form-id>', 'Form ID to deploy')
    .option(
      '--target <provider>',
      `Target deployment provider (${getDeploymentProviders()
        .map((p) => p.name)
        .join(' | ')})`
    )
    // Add common provider options that will be passed through
    .option('--bucket <name>', 'R2 bucket name (for Cloudflare)')
    .option('--public-url <url>', 'Public base URL (for Cloudflare)')
    .option('--access-key-id <id>', 'R2 Access Key ID (for Cloudflare)')
    .option('--secret-access-key <key>', 'R2 Secret Access Key (for Cloudflare)')
    .option('--endpoint <url>', 'S3 endpoint (for Cloudflare)')
    .option('--account-id <id>', 'Cloudflare account ID')
    .option('--overwrite', 'Overwrite existing objects (for Cloudflare)')
    .option('--port <port>', 'Port number (for local)')
    .option('--host <host>', 'Host address (for local)')
    .action(async (formId: string, options: any) => {
      const providers = getDeploymentProviders();
      let selectedProvider;

      // If --target is specified, use it
      if (options.target) {
        selectedProvider = providers.find((p) => p.name === options.target);
        if (!selectedProvider) {
          console.log(
            chalk.red(
              `Unknown target "${options.target}". Available targets: ${providers
                .map((p) => p.name)
                .join(', ')}`
            )
          );
          return;
        }
      } else {
        // Prompt user to select a target
        const inquirerModule = await import('inquirer');
        const inquirer = inquirerModule.default || inquirerModule;
        
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Select deployment target:',
            choices: providers.map((p) => ({
              name: `${p.name} - ${p.description}`,
              value: p.name,
            })),
            default: getDefaultProvider().name,
          },
        ]);

        selectedProvider = providers.find((p) => p.name === answer.provider);
      }

      if (!selectedProvider) {
        console.log(chalk.red('No provider selected'));
        return;
      }

      // Execute the selected provider with the options
      await selectedProvider.execute(config, formId, options);
    });

  return cmd;
}
