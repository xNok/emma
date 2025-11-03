/**
 * Deployment Providers Registry
 * Dynamically discovers and loads providers from installed packages
 */

import type { Command } from 'commander';
import type { EmmaConfig } from '../config.js';
import { localProvider } from './local.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  /**
   * Interactive provider setup for emma init
   * Should prompt for resource creation or config, validate, and save config
   * Returns an object indicating success status and any messages
   */
  init?: (config: EmmaConfig) => Promise<{
    success: boolean;
    message?: string;
  }>;
  /**
   * Check if the provider is fully ready for use
   * Should verify that all required setup and capabilities are working
   * Returns readiness status and any issues found
   */
  checkReadiness?: (config: EmmaConfig) => Promise<{
    ready: boolean;
    issues?: string[];
  }>;
}

/**
 * Cache for loaded providers to avoid multiple imports
 */
let providersCache: DeploymentProviderDefinition[] | null = null;

/**
 * Dynamically discover and load provider packages
 */
async function discoverProviders(): Promise<DeploymentProviderDefinition[]> {
  if (providersCache) {
    return providersCache;
  }

  const providers: DeploymentProviderDefinition[] = [localProvider];
  const checkedPaths = new Set<string>();

  // Helper to scan a node_modules directory
  async function scanNodeModules(nodeModulesPath: string) {
    if (checkedPaths.has(nodeModulesPath)) return;
    checkedPaths.add(nodeModulesPath);

    try {
      const xnokScope = path.join(nodeModulesPath, '@xnok');
      if (!(await fs.pathExists(xnokScope))) return;

      const packages = await fs.readdir(xnokScope);
      for (const pkg of packages) {
        if (pkg.startsWith('emma-provider-')) {
          try {
            const providerPath = path.join(xnokScope, pkg);
            const provider = await loadProvider(providerPath);
            if (provider && !providers.find((p) => p.name === provider.name)) {
              providers.push(provider);
            }
          } catch (error) {
            console.debug(`Skipping invalid provider: @xnok/${pkg}`, error);
          }
        }
      }
    } catch (error) {
      console.debug(`Error scanning ${nodeModulesPath}:`, error);
    }
  }

  // 1. Check local project node_modules
  await scanNodeModules(path.join(process.cwd(), 'node_modules'));

  // 2. Check CLI installation location (for global installs and npx)
  try {
    const cliNodeModules = path.join(__dirname, '..', '..', '..', '..');
    if (await fs.pathExists(cliNodeModules)) {
      await scanNodeModules(cliNodeModules);
    }
  } catch (error) {
    console.debug('Error checking CLI location:', error);
  }

  // 3. For global installs, check parent directories from cwd
  try {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      currentDir = path.dirname(currentDir);
      const nodeModules = path.join(currentDir, 'node_modules');
      if (await fs.pathExists(nodeModules)) {
        await scanNodeModules(nodeModules);
      }
    }
  } catch (error) {
    console.debug('Error checking parent directories:', error);
  }

  providersCache = providers;
  return providers;
}

/**
 * Load a provider from a package path
 */
async function loadProvider(
  providerPath: string
): Promise<DeploymentProviderDefinition | null> {
  try {
    // Try to load the package.json
    const packageJsonPath = path.join(providerPath, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      return null;
    }

    const packageJson = (await fs.readJson(packageJsonPath)) as {
      name: string;
      main?: string;
    };

    // Try to load the provider's main export
    const mainFile = packageJson.main || 'dist/index.js';
    const providerMainPath = path.join(providerPath, mainFile);

    const providerModule = (await import(providerMainPath)) as Record<
      string,
      unknown
    >;

    // Try different export patterns
    let provider: DeploymentProviderDefinition | null = null;

    // Pattern 1: Look for exports ending with 'Provider' (e.g., cloudflareProvider, s3Provider)
    for (const [key, value] of Object.entries(providerModule)) {
      if (
        key.endsWith('Provider') &&
        typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'description' in value
      ) {
        provider = value as DeploymentProviderDefinition;
        break;
      }
    }

    // Pattern 2: Look for factory functions starting with 'create' (e.g., createCloudflareProvider)
    if (!provider) {
      for (const [key, value] of Object.entries(providerModule)) {
        if (key.startsWith('create') && typeof value === 'function') {
          try {
            // Try to create the provider, optionally passing FormManager
            const { FormManager } = await import('../form-manager.js');
            provider = value(FormManager) as DeploymentProviderDefinition;
          } catch {
            // If FormManager import fails, create provider without it
            provider = (value as () => DeploymentProviderDefinition)();
          }
          if (
            provider &&
            typeof provider.name === 'string' &&
            typeof provider.description === 'string'
          ) {
            break;
          }
          provider = null; // Reset if validation failed
        }
      }
    }

    if (
      provider &&
      typeof provider.name === 'string' &&
      typeof provider.description === 'string'
    ) {
      return provider;
    }
  } catch (error) {
    console.debug(`Failed to load provider from ${providerPath}:`, error);
  }

  return null;
}

/**
 * Get all available deployment providers (including dynamically loaded ones)
 */
export async function getDeploymentProviders(): Promise<
  DeploymentProviderDefinition[]
> {
  return await discoverProviders();
}

/**
 * Synchronous version for backward compatibility
 * Only returns local provider if dynamic discovery hasn't been done yet
 */
export function getDeploymentProvidersSync(): DeploymentProviderDefinition[] {
  return providersCache || [localProvider];
}

export const defaultProviderName = 'local';

export async function getDefaultProvider(): Promise<DeploymentProviderDefinition> {
  const providers = await getDeploymentProviders();
  return providers.find((p) => p.name === defaultProviderName) || providers[0];
}
