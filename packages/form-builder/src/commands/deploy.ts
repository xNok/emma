/**
 * Deploy Command - Subcommands per target (local, cloudflare)
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

  // Register all providers as subcommands
  // Note: Providers are registered lazily via preAction hook due to async discovery.
  // This means provider-specific commands won't show in top-level help (`emma deploy --help`),
  // but will be available when used (e.g., `emma deploy cloudflare <form-id>`).
  // Help for specific providers (e.g., `emma deploy cloudflare --help`) works correctly.
  cmd.hook('preAction', async () => {
    const providers = await getDeploymentProviders();
    for (const provider of providers) {
      provider.register(cmd, config);
    }
  });

  return cmd;
}
