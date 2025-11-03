/**
 * Cloudflare Provider Definition
 * Complete provider implementation with CLI registration, deployment, and initialization
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type {
  DeploymentProviderDefinition,
  ProviderOptions,
} from '@xnok/emma-shared/types';
import {
  CloudflareR2Deployment,
  type CloudflareDeploymentOptions,
  type EmmaConfigInterface,
} from './deploy.js';
import { ApiWorkerDeployment } from './api-worker.js';

/**
 * Form Manager interface - minimal interface needed for deployment
 */
export interface FormManagerInterface {
  ensureBuilt(formId: string): Promise<void>;
}

/**
 * Create the Cloudflare deployment provider definition
 * This can be dynamically imported by the CLI
 */
export function createCloudflareProvider(
  FormManagerClass?: new (config: EmmaConfigInterface) => FormManagerInterface
): DeploymentProviderDefinition<Command, EmmaConfigInterface> {
  return {
    name: 'cloudflare',
    description: 'Deploy to Cloudflare R2',
    capabilities: ['deploy'],

    register(parent: Command, config: EmmaConfigInterface) {
      parent
        .command('cloudflare')
        .description(this.description)
        .argument('<form-id>', 'Form ID to deploy')
        .option('--bucket <name>', 'Cloudflare R2 bucket name')
        .option(
          '--public-url <url>',
          'Public base URL serving R2 objects (e.g., https://forms.example.com)'
        )
        .option(
          '--access-key-id <id>',
          'R2 Access Key ID (env R2_ACCESS_KEY_ID)'
        )
        .option(
          '--secret-access-key <key>',
          'R2 Secret Access Key (env R2_SECRET_ACCESS_KEY)'
        )
        .option(
          '--endpoint <url>',
          'S3 endpoint (defaults to https://<accountId>.r2.cloudflarestorage.com)'
        )
        .option(
          '--account-id <id>',
          'Cloudflare account ID (used to derive S3 endpoint)'
        )
        .option('--overwrite', 'Overwrite existing objects in R2', false)
        .option(
          '-s, --snapshot <timestamp>',
          'Deploy a specific snapshot by timestamp'
        )
        .action(async (formId: string, options: ProviderOptions) => {
          await this.execute?.(config, formId, options);
        });
    },

    async execute(
      config: EmmaConfigInterface,
      formId: string,
      options: ProviderOptions
    ): Promise<void> {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      const schema = await config.loadFormSchema(formId);
      if (!schema) {
        console.log(chalk.red(`Form "${formId}" not found.`));
        return;
      }

      const spinner = ora(
        'Building and deploying form (Cloudflare)...'
      ).start();

      // If FormManagerClass was provided, use it to ensure the form is built
      if (FormManagerClass) {
        try {
          const manager = new FormManagerClass(config);
          await manager.ensureBuilt(formId);
          spinner.text = 'Deploying to Cloudflare...';
        } catch (error) {
          spinner.fail('Build failed');
          console.log(
            chalk.red(
              `Error: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          throw error;
        }
      }

      try {
        const cfConfig = config.get('cloudflare');
        const cfOptions: CloudflareDeploymentOptions = {
          bucket: (options.bucket as string) || cfConfig?.bucket || '',
          publicUrl: (options.publicUrl as string) || cfConfig?.publicUrl || '',
          accessKeyId:
            (options.accessKeyId as string) || process.env.R2_ACCESS_KEY_ID,
          secretAccessKey:
            (options.secretAccessKey as string) ||
            process.env.R2_SECRET_ACCESS_KEY,
          endpoint: (options.endpoint as string) || process.env.R2_ENDPOINT,
          accountId: (options.accountId as string) || cfConfig?.accountId,
          overwrite: Boolean(options.overwrite),
          snapshot: options.snapshot as string | undefined,
        };

        if (!cfOptions.bucket || !cfOptions.publicUrl) {
          throw new Error(
            'Cloudflare deployment requires --bucket and --public-url (or set config.cloudflare)'
          );
        }

        const cf = new CloudflareR2Deployment(config);
        const result = await cf.deploy(formId, cfOptions);

        spinner.succeed('Form deployed to Cloudflare');

        console.log('');
        console.log(chalk.green('🚀 Cloudflare deployment complete!'));
        console.log('');
        console.log(chalk.cyan('Form Landing Page:'));
        console.log(`  ${result.indexUrl}`);
        console.log('');
        console.log(chalk.cyan('Assets:'));
        console.log(`  - Form Bundle:    ${result.bundleUrl}`);
        if (result.themeUrl) {
          console.log(`  - Theme CSS:      ${result.themeUrl}`);
        }
        console.log(`  - Form Renderer:  ${result.rendererUrl}`);
        console.log(`  - Form Schema:    ${result.schemaUrl}`);
        console.log('');
        console.log(chalk.cyan('Hugo Shortcode:'));
        console.log(`  {{< embed-form "${formId}" >}}`);
        console.log('');
        console.log(chalk.dim('Ensure your Hugo cdnUrl is set to:'));
        console.log(chalk.dim(`  ${cfOptions.publicUrl}`));
      } catch (error) {
        spinner.fail('Deployment failed');
        console.log(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        throw error;
      }
    },

    async init(config: EmmaConfigInterface) {
      try {
        // Interactive setup for Cloudflare R2
        const inquirerModule = await import('inquirer');
        const inquirer = inquirerModule.default || inquirerModule;

        // Step 1: Validate environment variables
        console.log('');
        const envCheck = ApiWorkerDeployment.validateEnvironment();

        if (!envCheck.valid) {
          console.log(
            chalk.yellow('⚠️  Missing required environment variables:')
          );
          envCheck.missing.forEach((v) => console.log(chalk.red(`   - ${v}`)));
          console.log('');

          const { setupNow } = (await inquirer.prompt([
            {
              type: 'confirm',
              name: 'setupNow',
              message: 'Would you like to see setup instructions?',
              default: true,
            },
          ])) as { setupNow: boolean };

          if (setupNow) {
            ApiWorkerDeployment.displayEnvSetupInstructions();
            return {
              success: false,
              message:
                'Setup instructions displayed. Please set environment variables and run "emma init" again.',
            };
          }

          return {
            success: false,
            message:
              'Cannot proceed without required environment variables. Please set them and run "emma init" again.',
          };
        }

        if (envCheck.warnings.length > 0) {
          console.log(
            chalk.yellow('⚠️  Recommended environment variables not set:')
          );
          envCheck.warnings.forEach((v) => console.log(chalk.dim(`   - ${v}`)));
          console.log(
            chalk.dim('   (These are needed for deploying forms to R2)')
          );
          console.log('');
        }

        // Step 2: Cloudflare configuration prompts
        console.log(chalk.cyan('Cloudflare Configuration:'));
        console.log('');
        const answers = (await inquirer.prompt([
          {
            type: 'input',
            name: 'accountId',
            message: 'Cloudflare Account ID:',
            validate: (input: string) =>
              input.trim().length > 0 || 'Account ID is required',
          },
          {
            type: 'input',
            name: 'bucket',
            message: 'R2 bucket name:',
            default: 'emma-forms',
          },
          {
            type: 'input',
            name: 'publicUrl',
            message:
              'Public base URL for forms (e.g., https://forms.example.com):',
            validate: (input: string) =>
              input.trim().length > 0 || 'Public URL is required',
          },
          {
            type: 'input',
            name: 'databaseName',
            message: 'D1 database name:',
            default: 'emma-submissions',
          },
          {
            type: 'confirm',
            name: 'deployWorker',
            message: 'Deploy API worker to Cloudflare now?',
            default: true,
          },
        ])) as {
          bucket: string;
          publicUrl: string;
          accountId: string;
          databaseName: string;
          deployWorker: boolean;
        };

        // Step 3: Save configuration
        config.set('cloudflare', {
          bucket: answers.bucket,
          publicUrl: answers.publicUrl,
          accountId: answers.accountId,
          databaseName: answers.databaseName,
        });
        await config.save();

        // Step 4: Deploy API worker if requested
        if (answers.deployWorker) {
          console.log('');
          console.log(chalk.cyan('🚀 Deploying API worker to Cloudflare...'));
          console.log('');

          try {
            const deployer = new ApiWorkerDeployment();
            const result = await deployer.deploy({
              accountId: answers.accountId,
              databaseName: answers.databaseName,
            });

            console.log('');
            console.log(chalk.green('✅ API worker deployed successfully!'));
            console.log('');
            console.log(chalk.cyan('Deployment Details:'));
            console.log(`  Worker URL:    ${result.workerUrl}`);
            console.log(
              `  Database:      ${result.databaseName} (${result.databaseId})`
            );
            console.log('');

            // Save worker URL to config
            config.set('cloudflare', {
              ...config.get('cloudflare'),
              workerUrl: result.workerUrl,
              databaseId: result.databaseId,
            });
            await config.save();

            console.log(chalk.green('✅ Cloudflare configuration saved!'));
            console.log('');
            console.log(chalk.cyan('Next steps:'));
            console.log('  1. Create a form:     $ emma create my-first-form');
            console.log('  2. Preview locally:   $ emma preview my-first-form');
            console.log(
              '  3. Deploy to R2:      $ emma deploy cloudflare my-first-form'
            );
            return { success: true };
          } catch (error) {
            console.log('');
            console.log(
              chalk.red(
                `❌ API worker deployment failed: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            console.log('');
            console.log(
              chalk.yellow(
                'Configuration has been saved, but API worker is not deployed.'
              )
            );
            console.log(
              chalk.yellow(
                'You can manually deploy the API worker later or run "emma init --override" to try again.'
              )
            );
            return {
              success: true,
              message:
                'Configuration saved but API worker deployment failed. You can deploy manually later.',
            };
          }
        } else {
          console.log(chalk.green('\n✅ Cloudflare R2 configuration saved!'));
          console.log(
            chalk.dim(
              '\nNote: Ensure R2 S3 credentials are set via env (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).'
            )
          );
          console.log(
            chalk.yellow(
              '\n⚠️  API worker was not deployed. You will need to deploy it manually.'
            )
          );
          return {
            success: true,
            message:
              'Configuration saved but API worker not deployed. Deploy manually when ready.',
          };
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    },

    async checkReadiness(config: EmmaConfigInterface) {
      const cfConfig = config.get('cloudflare');
      if (!cfConfig) {
        return {
          ready: false,
          issues: ['Cloudflare provider not configured'],
        };
      }

      const issues: string[] = [];

      // Check required configuration
      if (!cfConfig.accountId) {
        issues.push('Account ID not configured');
      }
      if (!cfConfig.bucket) {
        issues.push('R2 bucket not configured');
      }
      if (!cfConfig.publicUrl) {
        issues.push('Public URL not configured');
      }

      // Check environment variables for R2 access
      if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        issues.push(
          'R2 credentials not set (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)'
        );
      }

      // Check if API worker is deployed
      if (!cfConfig.workerUrl) {
        issues.push('API worker not deployed');
      }

      return {
        ready: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined,
      };
    },
  };
}

/**
 * Default export - the provider definition
 * This is what will be imported when the CLI discovers the provider
 */
export const cloudflareProvider = createCloudflareProvider();
