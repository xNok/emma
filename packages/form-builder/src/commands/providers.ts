/**
 * Provider Management Commands
 * Implements provider discovery, listing, installation, and info display
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { BUILT_IN_PROVIDERS } from '../deployment/index.js';
import type { EmmaConfig } from '../config.js';
import type { ProviderManifest } from '@xnok/emma-shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Discover providers installed in node_modules
 * Checks multiple locations to support:
 * - Local project install (process.cwd()/node_modules)
 * - Global npm/yarn install (use require.resolve to find installed location)
 * - npx usage (providers in same location as CLI)
 */
async function discoverInstalledProviders(): Promise<ProviderManifest[]> {
  const providers: ProviderManifest[] = [];
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
            const manifest = await loadProviderManifest(providerPath);
            if (manifest && !providers.find((p) => p.name === manifest.name)) {
              providers.push(manifest);
            }
          } catch (error) {
            console.debug(`Skipping invalid provider: @xnok/${pkg}`);
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
  // When running as ESM, we can use import.meta.url to find our location
  try {
    // Find the node_modules relative to where this file is running
    // Typically: node_modules/@xnok/emma-form-builder/dist/commands/providers.js
    // So we go up 4 levels to get to node_modules
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
      // Check up to 5 levels up
      currentDir = path.dirname(currentDir);
      const nodeModules = path.join(currentDir, 'node_modules');
      if (await fs.pathExists(nodeModules)) {
        await scanNodeModules(nodeModules);
      }
    }
  } catch (error) {
    console.debug('Error checking parent directories:', error);
  }

  return providers;
}

/**
 * Package.json structure (minimal)
 */
interface PackageJson {
  name: string;
  version?: string;
  description?: string;
  main?: string;
}

/**
 * Type guard to check if an object looks like a ProviderManifest
 */
function isProviderManifest(obj: unknown): obj is ProviderManifest {
  if (!obj || typeof obj !== 'object') return false;
  const manifest = obj as Record<string, unknown>;
  return (
    typeof manifest.name === 'string' &&
    typeof manifest.packageName === 'string' &&
    Array.isArray(manifest.capabilities)
  );
}

/**
 * Load provider manifest from a package
 */
async function loadProviderManifest(
  providerPath: string
): Promise<ProviderManifest | null> {
  try {
    // Try to load the package.json
    const packageJsonPath = path.join(providerPath, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      return null;
    }

    const packageJson = (await fs.readJson(packageJsonPath)) as PackageJson;

    // Try to load the provider's main export
    // Use the explicit path from package.json main/exports field
    const mainFile = packageJson.main || 'dist/index.js';
    const providerMainPath = path.join(providerPath, mainFile);

    const providerModule = (await import(providerMainPath)) as {
      default?: unknown;
      manifest?: unknown;
    };
    const manifest = providerModule.default || providerModule.manifest;

    if (isProviderManifest(manifest)) {
      return {
        name: manifest.name,
        displayName: manifest.displayName || packageJson.name,
        description: manifest.description || packageJson.description || '',
        packageName: manifest.packageName,
        version: manifest.version || packageJson.version,
        capabilities: manifest.capabilities,
        isAvailable: manifest.isAvailable,
      };
    }
  } catch (error) {
    console.debug(`Failed to load manifest from ${providerPath}:`, error);
  }

  return null;
}

/**
 * Get list of known/recommended providers (could be from a registry)
 * Excludes built-in providers since they're always available
 */
function getKnownProviders(): Array<{
  name: string;
  packageName: string;
  description: string;
}> {
  const builtInNames = (BUILT_IN_PROVIDERS as readonly string[]).map((id) => {
    // Extract provider name from package identifier
    // @xnok/emma-provider-cloudflare -> cloudflare
    const match = id.match(/emma-provider-(\w+)/);
    return match ? match[1] : id;
  });

  const allKnownProviders: Array<{
    name: string;
    packageName: string;
    description: string;
  }> = [
    // Future providers could be added here
    // {
    //   name: 'digitalocean',
    //   packageName: '@emma/provider-digitalocean',
    //   description: 'Deploy to DigitalOcean Spaces',
    // },
  ];

  return allKnownProviders.filter(
    (provider) => !builtInNames.includes(provider.name)
  );
}

/**
 * List providers command
 */
function listProvidersCommand(_config: EmmaConfig): Command {
  return new Command('list')
    .description('List installed and available providers')
    .option('--available', 'Show available providers (not just installed)')
    .action(async (options: { available?: boolean }) => {
      console.log(chalk.cyan('\n📦 Emma Form Providers\n'));

      // Show built-in providers
      console.log(chalk.bold('Built-in Providers:'));
      console.log('');

      for (const providerId of BUILT_IN_PROVIDERS) {
        // Extract provider name from package identifier
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const match = providerId.match(/emma-provider-(\w+)/);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const providerName = match?.[1] ?? providerId;

        console.log(`  ${chalk.bold(providerName)} ${chalk.dim('(built-in)')}`);
        console.log(`    Available as part of Emma CLI`);
        console.log('');
      }

      // List installed providers (discovered dynamically)
      const spinner = ora('Discovering installed providers...').start();
      const installed = await discoverInstalledProviders();
      spinner.stop();

      // Filter out built-in providers from installed list
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const builtInNames = (BUILT_IN_PROVIDERS as readonly string[]).map(
        (id) => {
          const match = id.match(/emma-provider-(\w+)/);
          return match?.[1] ?? id;
        }
      );
      const additionalInstalled = installed.filter(
        (p) => !builtInNames.includes(p.name)
      );

      if (additionalInstalled.length > 0) {
        console.log(chalk.bold('Additional Installed Providers:'));
        console.log('');

        for (const provider of additionalInstalled) {
          const available = provider.isAvailable
            ? await provider.isAvailable()
            : true;
          const status = available
            ? chalk.green('✓ Ready')
            : chalk.yellow('⚠ Not configured');

          console.log(
            `  ${chalk.bold(provider.name)} ${chalk.dim(`(v${provider.version || 'unknown'})`)}`
          );
          console.log(`    ${provider.description}`);
          console.log(`    Status: ${status}`);
          console.log(`    Capabilities: ${provider.capabilities.join(', ')}`);
          console.log('');
        }
      }

      // List available providers if requested
      if (options.available) {
        const known = getKnownProviders();
        const installedNames = new Set(installed.map((p) => p.name));
        const available = known.filter((p) => !installedNames.has(p.name));

        if (available.length > 0) {
          console.log(chalk.bold('Available Providers:'));
          console.log('');

          for (const provider of available) {
            console.log(`  ${chalk.bold(provider.name)}`);
            console.log(`    ${provider.description}`);
            console.log(
              `    Install: ${chalk.cyan(`npm install ${provider.packageName}`)}`
            );
            console.log('');
          }
        }
      } else {
        console.log(chalk.dim('💡 Run with --available to see more providers'));
      }
    });
}

/**
 * Info command for a specific provider
 */
function providerInfoCommand(_config: EmmaConfig): Command {
  return new Command('info')
    .description('Show detailed information about a provider')
    .argument('<provider-name>', 'Name of the provider')
    .action(async (providerName: string) => {
      const spinner = ora('Loading provider information...').start();
      const installed = await discoverInstalledProviders();
      spinner.stop();

      const provider = installed.find((p) => p.name === providerName);

      if (!provider) {
        console.log(chalk.red(`\n❌ Provider "${providerName}" not found.`));
        console.log(
          chalk.dim('Run "emma providers list" to see installed providers.\n')
        );
        return;
      }

      console.log(chalk.cyan(`\n📦 ${provider.displayName}\n`));
      console.log(chalk.bold('Package:'), provider.packageName);
      console.log(chalk.bold('Version:'), provider.version || 'unknown');
      console.log(chalk.bold('Description:'), provider.description);
      console.log(
        chalk.bold('Capabilities:'),
        provider.capabilities.join(', ')
      );

      if (provider.isAvailable) {
        const available = await provider.isAvailable();
        const status = available
          ? chalk.green('✓ Ready')
          : chalk.yellow('⚠ Not configured');
        console.log(chalk.bold('Status:'), status);

        if (!available) {
          console.log('');
          console.log(chalk.yellow('This provider needs configuration.'));
          console.log(
            chalk.dim(
              `Run "emma init --provider ${providerName}" to configure it.`
            )
          );
        }
      }

      console.log('');
    });
}

/**
 * Install command for providers
 */
function installProviderCommand(_config: EmmaConfig): Command {
  return new Command('install')
    .description('Install a provider package')
    .argument('<provider-name>', 'Name of the provider to install')
    .option('--npm', 'Use npm instead of yarn')
    .action(async (providerName: string, options: { npm?: boolean }) => {
      const known = getKnownProviders();
      const provider = known.find((p) => p.name === providerName);

      if (!provider) {
        console.log(chalk.red(`\n❌ Unknown provider "${providerName}".`));
        console.log(
          chalk.dim(
            'Run "emma providers list --available" to see available providers.\n'
          )
        );
        return;
      }

      console.log(chalk.cyan(`\n📦 Installing ${provider.packageName}...\n`));

      const packageManager = options.npm ? 'npm' : 'yarn';
      const installCmd = options.npm
        ? `npm install ${provider.packageName}`
        : `yarn add ${provider.packageName}`;

      console.log(chalk.dim(`Running: ${installCmd}\n`));

      const { spawn } = await import('child_process');
      const proc = spawn(packageManager, ['add', provider.packageName], {
        stdio: 'inherit',
      });

      proc.on('close', (code) => {
        if (code === 0) {
          console.log(
            chalk.green(`\n✅ Provider ${providerName} installed successfully!`)
          );
          console.log(
            chalk.dim(
              `\nRun "emma init --provider ${providerName}" to configure it.\n`
            )
          );
        } else {
          console.log(
            chalk.red(`\n❌ Installation failed with code ${code}\n`)
          );
        }
      });
    });
}

/**
 * Main providers command
 */
export function providersCommand(config: EmmaConfig): Command {
  const cmd = new Command('providers')
    .description('Manage Emma form providers')
    .alias('provider');

  // Add subcommands
  cmd.addCommand(listProvidersCommand(config));
  cmd.addCommand(providerInfoCommand(config));
  cmd.addCommand(installProviderCommand(config));

  // Default action: show help
  cmd.action(() => {
    cmd.help();
  });

  return cmd;
}

/**
 * Check if a required provider is available, and prompt to install if not
 */
export async function ensureProviderAvailable(
  providerName: string,
  capability: string
): Promise<boolean> {
  const installed = await discoverInstalledProviders();
  const provider = installed.find(
    (p) =>
      p.name === providerName && p.capabilities.includes(capability as never)
  );

  if (!provider) {
    console.log(
      chalk.yellow(`\n⚠️  Provider "${providerName}" is not installed.`)
    );
    console.log(
      chalk.dim(
        `This command requires a provider with "${capability}" capability.\n`
      )
    );

    const inquirerModule = await import('inquirer');
    const inquirer = inquirerModule.default || inquirerModule;

    const { install } = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: `Would you like to install ${providerName} now?`,
        default: true,
      },
    ])) as { install: boolean };

    if (install) {
      const known = getKnownProviders();
      const knownProvider = known.find((p) => p.name === providerName);

      if (knownProvider) {
        console.log(
          chalk.cyan(`\nInstalling ${knownProvider.packageName}...\n`)
        );

        const { spawn } = await import('child_process');
        return new Promise((resolve) => {
          const proc = spawn('yarn', ['add', knownProvider.packageName], {
            stdio: 'inherit',
          });

          proc.on('close', (code) => {
            if (code === 0) {
              console.log(
                chalk.green(`\n✅ Provider installed successfully!\n`)
              );
              resolve(true);
            } else {
              console.log(chalk.red(`\n❌ Installation failed.\n`));
              resolve(false);
            }
          });
        });
      }
    }

    return false;
  }

  // Check if provider is configured
  if (provider.isAvailable) {
    const available = await provider.isAvailable();
    if (!available) {
      console.log(
        chalk.yellow(
          `\n⚠️  Provider "${providerName}" is installed but not configured.`
        )
      );
      console.log(
        chalk.dim(
          `Run "emma init --provider ${providerName}" to configure it.\n`
        )
      );
      return false;
    }
  }

  return true;
}
