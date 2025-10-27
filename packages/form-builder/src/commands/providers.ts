/**
 * Provider Management Commands
 * Implements provider discovery, listing, installation, and info display
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import type { EmmaConfig } from '../config.js';
import type { ProviderManifest } from '@xnok/emma-shared/types';

/**
 * Discover providers installed in node_modules
 */
async function discoverInstalledProviders(): Promise<ProviderManifest[]> {
  const providers: ProviderManifest[] = [];

  try {
    // Look for packages matching @emma/provider-* or @*/provider-*
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');

    // Check @emma scope
    const emmaScope = path.join(nodeModulesPath, '@emma');
    if (await fs.pathExists(emmaScope)) {
      const packages = await fs.readdir(emmaScope);
      for (const pkg of packages) {
        if (pkg.startsWith('provider-')) {
          try {
            const providerPath = path.join(emmaScope, pkg);
            const manifest = await loadProviderManifest(providerPath);
            if (manifest) {
              providers.push(manifest);
            }
          } catch (error) {
            // Skip invalid providers
            console.debug(`Skipping invalid provider: @emma/${pkg}`);
          }
        }
      }
    }
  } catch (error) {
    // No providers found or error reading directory
    console.debug('Error discovering providers:', error);
  }

  return providers;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const packageJson = await fs.readJson(packageJsonPath);

    // Try to load the provider's main export
    // Use the explicit path from package.json main/exports field
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const mainFile = (packageJson.main as string) || 'dist/index.js';
    const providerMainPath = path.join(providerPath, mainFile);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const providerModule = await import(providerMainPath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const manifest = providerModule.default || providerModule.manifest;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (manifest && typeof manifest === 'object') {
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        name: manifest.name || packageJson.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        displayName: manifest.displayName || packageJson.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        description: manifest.description || packageJson.description || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        packageName: manifest.packageName || packageJson.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        version: manifest.version || packageJson.version,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        capabilities: manifest.capabilities || [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
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
 */
function getKnownProviders(): Array<{
  name: string;
  packageName: string;
  description: string;
}> {
  return [
    {
      name: 'cloudflare',
      packageName: '@emma/provider-cloudflare',
      description: 'Deploy to Cloudflare R2 and query submissions from D1',
    },
    // Future providers could be added here
    // {
    //   name: 'digitalocean',
    //   packageName: '@emma/provider-digitalocean',
    //   description: 'Deploy to DigitalOcean Spaces',
    // },
  ];
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

      // List installed providers
      const spinner = ora('Discovering installed providers...').start();
      const installed = await discoverInstalledProviders();
      spinner.stop();

      if (installed.length > 0) {
        console.log(chalk.bold('Installed Providers:'));
        console.log('');

        for (const provider of installed) {
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
      } else {
        console.log(chalk.yellow('No providers installed.'));
        console.log('');
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
