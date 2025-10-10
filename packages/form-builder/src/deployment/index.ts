/**
 * Deployment Providers Registry (no concrete deps in deploy.ts)
 */

import type { Command } from 'commander';
import type { EmmaConfig } from '../config.js';
import { localProvider } from './local.js';
import { cloudflareProvider } from './cloudflare.js';

export interface GenericProviderOptions {
  // Allow arbitrary flags from CLI; providers perform validation
  [key: string]: string | boolean | undefined;
}

export interface DeploymentProviderDefinition {
  name: string; // e.g., 'local', 'cloudflare'
  description: string;
  register(parent: Command, config: EmmaConfig): void; // adds subcommand and flags
  execute(
    config: EmmaConfig,
    formId: string,
    options: GenericProviderOptions
  ): Promise<void>;
}

export function getDeploymentProviders(): DeploymentProviderDefinition[] {
  return [localProvider, cloudflareProvider];
}

export const defaultProviderName = 'local';

export function getDefaultProvider(): DeploymentProviderDefinition {
  const providers = getDeploymentProviders();
  return providers.find((p) => p.name === defaultProviderName) || providers[0];
}
