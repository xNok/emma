/**
 * Deploy Command - Subcommands per target (local, cloudflare)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import type { EmmaConfig } from '../config.js';
import {
  getDefaultProvider,
  getDeploymentProviders,
  getDeploymentProvidersSync,
} from '../deployment/index.js';

// No provider-specific types here; providers register their own flags

export function deployCommand(config: EmmaConfig): Command {
  const cmd = new Command('deploy').description(
    'Deploy a form to a target environment'
  );

  // Default: emma deploy <form-id> routes to default provider
  cmd
    .argument('[form-id]', 'Form ID to deploy')
    .action(async (formId?: string) => {
      if (!formId) {
        const providers = await getDeploymentProviders();
        const providerNames = providers.map((p) => p.name).join(' | ');
        console.log(
          chalk.yellow(
            `Usage: emma deploy <provider> <form-id> where <provider> is one of: ${providerNames}`
          )
        );
        return;
      }
      const def = await getDefaultProvider();
      await def.execute(config, formId, {});
    });

  // Register all providers as subcommands synchronously
  // Use sync version to ensure subcommands are available for parsing
  const providers = getDeploymentProvidersSync();
  for (const provider of providers) {
    if (typeof provider.register === 'function') {
      provider.register(cmd, config);
    } else {
      console.error('ERROR: provider does not have register method:', provider);
    }
  }

  return cmd;
}
