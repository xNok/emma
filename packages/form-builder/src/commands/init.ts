/**
 * Init Command - Initialize Emma configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { EmmaConfig } from '../config.js';

interface InitOptions {
  override?: boolean;
  theme?: string;
  port?: number;
  host?: string;
  provider?: string;
  providerOverride?: boolean;
}

interface PromptResults {
  defaultTheme?: string;
  localServerPort?: number;
  localServerHost?: string;
}

export function initCommand(config: EmmaConfig): Command {
  return new Command('init')
    .description('Initialize Emma configuration')
    .option(
      '--override',
      'Skip confirmation prompts and overwrite existing configuration'
    )
    .option('--theme <theme>', 'Default theme for new forms')
    .option('--port <port>', 'Local server port for previews', parseInt)
    .option('--host <host>', 'Local server host')
    .option('--provider <provider>', 'Deployment provider to configure')
    .option(
      '--provider-override',
      'Force re-initialization of the selected provider even if already configured'
    )
    .action(async (options: InitOptions) => {
      const { getDeploymentProviders } = await import('../deployment/index.js');
      console.log(chalk.cyan('🚀 Initializing Emma Forms CLI...'));
      console.log('');

      if (config.isInitialized()) {
        if (!options.override) {
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
        } else {
          console.log(
            chalk.yellow(
              '⚠️  Overriding existing configuration (--override flag used)'
            )
          );
        }
      }

      // Core configuration prompts
      const allPrompts = [
        {
          key: 'theme',
          option: options.theme,
          prompt: {
            type: 'input' as const,
            name: 'defaultTheme',
            message: 'Default theme for new forms:',
            default: config.get('defaultTheme'),
            validate: (input: string) =>
              input.trim().length > 0 || 'Theme name is required',
          },
        },
        {
          key: 'port',
          option: options.port,
          prompt: {
            type: 'input' as const,
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
        },
        {
          key: 'host',
          option: options.host,
          prompt: {
            type: 'input' as const,
            name: 'localServerHost',
            message: 'Local server host:',
            default: config.get('localServerHost'),
            validate: (input: string) =>
              input.trim().length > 0 || 'Host is required',
          },
        },
      ];

      const promptsToShow = allPrompts
        .filter(({ option }) => !option)
        .map(({ prompt }) => prompt);

      const promptResults =
        promptsToShow.length > 0
          ? ((await inquirer.prompt(promptsToShow)) as PromptResults)
          : {};

      const answers = {
        defaultTheme: options.theme || promptResults.defaultTheme,
        localServerPort: options.port || promptResults.localServerPort,
        localServerHost: options.host || promptResults.localServerHost,
      };

      // Update configuration
      if (answers.defaultTheme)
        config.set('defaultTheme', answers.defaultTheme);
      if (answers.localServerPort)
        config.set('localServerPort', answers.localServerPort);
      if (answers.localServerHost)
        config.set('localServerHost', answers.localServerHost);

      // Provider setup
      const providers = getDeploymentProviders();
      const selectedProviderName =
        options.provider ||
        (await (async () => {
          const providerPrompt = (await inquirer.prompt([
            {
              type: 'list',
              name: 'providerName',
              message: 'Select a deployment provider to configure:',
              choices: providers.map(
                (p: { description: string; name: string }) => ({
                  name: p.description,
                  value: p.name,
                })
              ),
            },
          ])) as { providerName: string };
          return providerPrompt.providerName;
        })());

      const selectedProvider = providers.find(
        (p: { name: string }) => p.name === selectedProviderName
      );

      if (!selectedProvider) {
        console.log(chalk.red(`Unknown provider: ${selectedProviderName}`));
        return;
      }

      let shouldRunProviderInit = false;

      // Check if provider needs initialization
      if (options.providerOverride) {
        console.log(
          chalk.yellow(
            `⚠️  Provider override enabled (--provider-override flag used)`
          )
        );
        shouldRunProviderInit = true;
      } else if (selectedProvider?.init) {
        // Check if provider is already configured and ready
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        const providerConfig = (config as any).get(selectedProviderName) as
          | Record<string, any>
          | undefined;
        const isConfigured =
          providerConfig && Object.keys(providerConfig).length > 0;

        if (isConfigured) {
          // Check if provider capabilities are ready
          const readinessCheck =
            await selectedProvider.checkReadiness?.(config);
          if (readinessCheck?.ready) {
            console.log(
              chalk.green(
                `✅ Provider '${selectedProviderName}' is already configured and ready`
              )
            );
            shouldRunProviderInit = false;
          } else {
            console.log(
              chalk.yellow(
                `⚠️  Provider '${selectedProviderName}' is configured but not fully ready`
              )
            );
            if (readinessCheck?.issues) {
              readinessCheck.issues.forEach((issue: string) =>
                console.log(chalk.dim(`   - ${issue}`))
              );
            }

            const { retryInit } = (await inquirer.prompt([
              {
                type: 'confirm',
                name: 'retryInit',
                message: 'Would you like to re-initialize this provider?',
                default: true,
              },
            ])) as { retryInit: boolean };

            shouldRunProviderInit = retryInit;
          }
        } else {
          shouldRunProviderInit = true;
        }
      }

      if (shouldRunProviderInit && selectedProvider?.init) {
        console.log(`Initializing provider: ${selectedProviderName}`);
        try {
          const result = await selectedProvider.init(config);
          if (result && !result.success) {
            console.log('');
            console.log(chalk.red('❌ Provider initialization failed!'));
            if (result.message) {
              console.log(chalk.red(`   ${result.message}`));
            }
            console.log('');
            console.log(
              chalk.yellow('The selected provider could not be configured.')
            );
            console.log(
              chalk.yellow(
                'You can try running "emma init --provider-override --provider ' +
                  selectedProviderName +
                  '" to retry,'
              )
            );
            console.log(chalk.yellow('or choose a different provider.'));
            console.log('');
            console.log(chalk.dim('Emma CLI was not fully initialized.'));
            return;
          }
        } catch (error) {
          console.log('');
          console.log(
            chalk.red(
              `❌ Provider initialization failed: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          console.log('');
          console.log(chalk.yellow('Emma CLI was not fully initialized.'));
          return;
        }
      }

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
      if (
        selectedProvider?.name &&
        selectedProvider.name === 'cloudflare' &&
        config.get('cloudflare')
      ) {
        console.log(`  Provider (cloudflare):`, config.get('cloudflare'));
      }
      console.log('');
      console.log(chalk.cyan('Next steps:'));
      console.log('  $ emma create my-first-form');
      console.log('  $ emma preview my-first-form-001');
    });
}
