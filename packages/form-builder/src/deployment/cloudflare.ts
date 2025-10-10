/**
 * Cloudflare R2 Deployment Provider
 */

import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import type { EmmaConfig as EmmaConfigType } from '../config.js';

export interface CloudflareDeploymentOptions {
  bucket: string; // R2 bucket name
  publicUrl: string; // Base public URL serving the bucket (e.g., https://forms.example.com)
  accountId?: string | undefined; // Optional explicit account ID
  apiToken?: string | undefined; // Optional explicit API token
  overwrite?: boolean; // Overwrite existing objects
}

export interface CloudflareDeploymentResult {
  bundleKey: string;
  bundleUrl: string;
  themeKey?: string;
  themeUrl?: string;
}

export class CloudflareR2Deployment {
  constructor(private config: EmmaConfig) {}

  async deploy(
    formId: string,
    options: CloudflareDeploymentOptions
  ): Promise<CloudflareDeploymentResult> {
    // Validate inputs
    if (!options.bucket) throw new Error('Missing R2 bucket name');
    if (!options.publicUrl) throw new Error('Missing publicUrl');

    // Resolve build artifacts
    const buildDir = this.config.getBuildPath(formId);
    const bundlePath = path.join(buildDir, `${formId}.js`);
    const themeDir = path.join(buildDir, 'themes');
    const themeCss = path.join(
      themeDir,
      `${await this.getThemeName(formId)}.css`
    );

    if (!(await fs.pathExists(bundlePath))) {
      throw new Error(`Bundle not found. Build first: ${bundlePath}`);
    }

    // Upload bundle and optional theme
    const bundleKey = `${formId}.js`;
    await this.uploadToR2(bundlePath, options.bucket, bundleKey, options);

    let themeKey: string | undefined;
    if (await fs.pathExists(themeCss)) {
      themeKey = `themes/${path.basename(themeCss)}`;
      await this.uploadToR2(themeCss, options.bucket, themeKey, options);
    }

    return {
      bundleKey,
      bundleUrl: this.joinUrl(options.publicUrl, bundleKey),
      themeKey,
      themeUrl: themeKey
        ? this.joinUrl(options.publicUrl, themeKey)
        : undefined,
    };
  }

  private async getThemeName(formId: string): Promise<string> {
    const schema = await this.config.loadFormSchema(formId);
    return schema?.theme || this.config.get('defaultTheme');
  }

  private joinUrl(base: string, key: string): string {
    return `${base.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  private async uploadToR2(
    filePath: string,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    // Prefer wrangler CLI for simplicity and reliability
    // Command: wrangler r2 object put <bucket>/<key> --file <file>
    const objectPath = `${bucket}/${key}`;

    // Optional overwrite: delete existing first to ensure correct metadata
    if (options.overwrite) {
      await this.runWrangler(['r2', 'object', 'delete', objectPath], options, {
        allowFail: true,
      });
    }

    await this.runWrangler(
      ['r2', 'object', 'put', objectPath, '--file', filePath],
      options
    );
  }

  private async runWrangler(
    args: string[],
    options: CloudflareDeploymentOptions,
    extra?: { allowFail?: boolean }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const env: NodeJS.ProcessEnv = { ...process.env };
      if (options.accountId) env.CLOUDFLARE_ACCOUNT_ID = options.accountId;
      if (options.apiToken) env.CLOUDFLARE_API_TOKEN = options.apiToken;

      const child = spawn('npx', ['-y', 'wrangler', ...args], {
        env,
        stdio: 'inherit',
      });

      child.on('error', (err) => {
        if (extra?.allowFail) return resolve();
        reject(err);
      });
      child.on('exit', (code) => {
        if (code === 0 || extra?.allowFail) return resolve();
        reject(
          new Error(`wrangler ${args.join(' ')} exited with code ${code}`)
        );
      });
    });
  }
}

// Provider wrapper for registry-based CLI
import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { EmmaConfig } from '../config.js';
import { FormManager } from '../form-manager.js';
import type {
  DeploymentProviderDefinition,
  GenericProviderOptions,
} from './index.js';

export const cloudflareProvider: DeploymentProviderDefinition = {
  name: 'cloudflare',
  description: 'Deploy to Cloudflare R2',

  async init(config) {
    // Use default import for inquirer
    const inquirerModule = await import('inquirer');
    const inquirer = inquirerModule.default || inquirerModule;
    const chalk = (await import('chalk')).default;
    console.log(chalk.cyan('\nCloudflare R2 Setup:'));
    const { setupMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupMode',
        message: 'How would you like to configure Cloudflare R2?',
        choices: [
          { name: 'Create new bucket (requires API token)', value: 'create' },
          { name: 'Use existing bucket', value: 'existing' },
        ],
      },
    ]);

    let bucket = '';
    let publicUrl = '';
    let accountId = '';
    // apiToken is not persisted in config

    if (setupMode === 'create') {
      // Prompt for accountId, apiToken, bucket name
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'accountId',
          message: 'Cloudflare Account ID:',
        },
        {
          type: 'input',
          name: 'apiToken',
          message: 'Cloudflare API Token (with R2 permissions):',
        },
        {
          type: 'input',
          name: 'bucket',
          message: 'New R2 bucket name:',
        },
        {
          type: 'input',
          name: 'publicUrl',
          message: 'Public base URL for bucket (e.g., https://forms.example.com):',
        },
      ]);
      accountId = answers.accountId;
      bucket = answers.bucket;
      publicUrl = answers.publicUrl;

      // Create bucket using wrangler CLI
      const { spawnSync } = await import('child_process');
      const result = spawnSync('npx', [
        '-y',
        'wrangler',
        'r2',
        'bucket',
        'create',
        bucket,
      ], {
        env: {
          ...process.env,
          CLOUDFLARE_ACCOUNT_ID: accountId,
          CLOUDFLARE_API_TOKEN: answers.apiToken,
        },
        stdio: 'inherit',
      });
      if (result.status !== 0) {
        console.log(chalk.red('Failed to create bucket. Please check credentials and try again.'));
        return;
      }
      console.log(chalk.green(`Bucket "${bucket}" created successfully.`));
    } else {
      // Use existing bucket
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'bucket',
          message: 'Existing R2 bucket name:',
        },
        {
          type: 'input',
          name: 'publicUrl',
          message: 'Public base URL for bucket (e.g., https://forms.example.com):',
        },
        {
          type: 'input',
          name: 'accountId',
          message: 'Cloudflare Account ID (optional):',
        },
      ]);
      bucket = answers.bucket;
      publicUrl = answers.publicUrl;
      accountId = answers.accountId;
    }

    // Save config (apiToken is not persisted)
    config.set('cloudflare', {
      bucket,
      publicUrl,
      accountId,
    });
    await config.save();
    console.log(chalk.green('\nCloudflare R2 configuration saved!'));
  },

  register(parent: Command, config: EmmaConfigType) {
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
        '--account-id <id>',
        'Cloudflare account ID (fallback to env CLOUDFLARE_ACCOUNT_ID)'
      )
      .option(
        '--api-token <token>',
        'Cloudflare API token (fallback to env CLOUDFLARE_API_TOKEN)'
      )
      .option('--overwrite', 'Overwrite existing objects in R2', false)
      .action(async (formId: string, options: GenericProviderOptions) => {
        await this.execute(config, formId, options);
      });
  },

  async execute(
    config: EmmaConfigType,
    formId: string,
    options: GenericProviderOptions
  ): Promise<void> {
    if (!config.isInitialized()) {
      console.log(chalk.red('Emma is not initialized. Run "emma init" first.'));
      return;
    }

    const schema = await config.loadFormSchema(formId);
    if (!schema) {
      console.log(chalk.red(`Form "${formId}" not found.`));
      return;
    }

    const manager = new FormManager(config);
    const spinner = ora('Deploying form (Cloudflare)...').start();

    try {
      await manager.ensureBuilt(formId);

      const cfConfig = config.get('cloudflare');
      const cfOptions: CloudflareDeploymentOptions = {
        bucket: (options.bucket as string) || cfConfig?.bucket || '',
        publicUrl: (options.publicUrl as string) || cfConfig?.publicUrl || '',
        accountId:
          (options.accountId as string) ||
          cfConfig?.accountId ||
          process.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken:
          (options.apiToken as string) || process.env.CLOUDFLARE_API_TOKEN,
        overwrite: Boolean(options.overwrite),
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
      console.log(chalk.cyan('Form Bundle URL:'));
      console.log(`  ${result.bundleUrl}`);
      if (result.themeUrl) {
        console.log('');
        console.log(chalk.cyan('Theme CSS URL:'));
        console.log(`  ${result.themeUrl}`);
      }
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
      process.exit(1);
    }
  },
};
