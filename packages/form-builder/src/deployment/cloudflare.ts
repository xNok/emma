/**
 * Cloudflare R2 Deployment Provider
 */

import fs from 'fs-extra';
import path from 'path';
// import { spawn } from 'child_process';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  type S3ServiceException,
} from '@aws-sdk/client-s3';
import type { EmmaConfig as EmmaConfigType } from '../config.js';

export interface CloudflareDeploymentOptions {
  bucket: string; // R2 bucket name
  publicUrl: string; // Base public URL serving the bucket (e.g., https://forms.example.com)
  accountId?: string | undefined; // Optional explicit account ID
  apiToken?: string | undefined; // Optional explicit API token
  overwrite?: boolean; // Overwrite existing objects
  // S3-only
  accessKeyId?: string; // R2 access key id
  secretAccessKey?: string; // R2 secret access key
  endpoint?: string; // Optional custom S3 endpoint (defaults to https://<accountId>.r2.cloudflarestorage.com)
}

export interface CloudflareDeploymentResult {
  bundleKey: string;
  bundleUrl: string;
  themeKey?: string;
  themeUrl?: string;
  indexKey?: string;
  indexUrl?: string;
  rendererKey?: string;
  rendererUrl?: string;
  schemaKey?: string;
  schemaUrl?: string;
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

    if (!(await fs.pathExists(bundlePath))) {
      throw new Error(`Bundle not found. Build first: ${bundlePath}`);
    }

    // Upload bundle and theme under per-form subdirectory
    const bundleKey = `${formId}/${formId}.js`;
    await this.uploadToR2(bundlePath, options.bucket, bundleKey, options);

    const schema = await this.config.loadFormSchema(formId);
    if (!schema) {
      throw new Error(`Schema not found for form "${formId}"`);
    }

    const themeCss = path.join(buildDir, 'themes', `${schema.theme}.css`);
    const indexPath = path.join(buildDir, 'index.html');
    const rendererPath = path.join(buildDir, 'emma-forms.esm.js');

    let themeKey: string | undefined;
    if (await fs.pathExists(themeCss)) {
      themeKey = `${formId}/themes/${path.basename(themeCss)}`;
      await this.uploadToR2(themeCss, options.bucket, themeKey, options);
    }

    const indexKey = `${formId}/index.html`;
    if (!(await fs.pathExists(indexPath))) {
      throw new Error(`Index file not found. Build first: ${indexPath}`);
    }
    await this.uploadToR2(indexPath, options.bucket, indexKey, options);

    const rendererKey = `${formId}/emma-forms.esm.js`;
    if (!(await fs.pathExists(rendererPath))) {
      throw new Error(`Renderer file not found. Build first: ${rendererPath}`);
    }
    await this.uploadToR2(rendererPath, options.bucket, rendererKey, options);

    const schemaKey = `${formId}/${formId}.json`;
    await this.uploadContentToR2(
      JSON.stringify(schema, null, 2),
      options.bucket,
      schemaKey,
      options
    );

    return {
      bundleKey,
      bundleUrl: this.joinUrl(options.publicUrl, bundleKey),
      themeKey,
      themeUrl: themeKey
        ? this.joinUrl(options.publicUrl, themeKey)
        : undefined,
      indexKey,
      indexUrl: this.joinUrl(options.publicUrl, indexKey),
      rendererKey,
      rendererUrl: this.joinUrl(options.publicUrl, rendererKey),
      schemaKey,
      schemaUrl: this.joinUrl(options.publicUrl, schemaKey),
    };
  }

  private async uploadContentToR2(
    content: string | Buffer,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    await this.uploadContentViaS3(content, bucket, key, options);
  }

  private async uploadContentViaS3(
    content: string | Buffer,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    const s3 = this.getS3Client(options);
    if (!options.overwrite) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(
          `Object already exists at ${bucket}/${key}. Use --overwrite to replace.`
        );
      } catch (err) {
        const e = err as S3ServiceException;
        const code = e.$metadata?.httpStatusCode;
        const msg = (e.name || e.message || '').toLowerCase();
        if (
          code !== 404 &&
          !msg.includes('not found') &&
          !msg.includes('no such key') &&
          !msg.includes('404')
        ) {
          throw err;
        }
      }
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
      })
    );
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
    await this.uploadViaS3(filePath, bucket, key, options);
  }

  private getS3Client(options: CloudflareDeploymentOptions): S3Client {
    const endpoint =
      options.endpoint ||
      (options.accountId
        ? `https://${options.accountId}.r2.cloudflarestorage.com`
        : undefined);
    if (!endpoint) {
      throw new Error(
        'Missing S3 endpoint: provide --endpoint or --account-id to derive R2 endpoint'
      );
    }
    if (!options.accessKeyId || !options.secretAccessKey) {
      throw new Error(
        'Missing R2 credentials: provide --access-key-id and --secret-access-key or set env vars'
      );
    }
    return new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  private async uploadViaS3(
    filePath: string,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    const s3 = this.getS3Client(options);
    // If not overwriting, check existence
    if (!options.overwrite) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(
          `Object already exists at ${bucket}/${key}. Use --overwrite to replace.`
        );
      } catch (err) {
        // Not found => proceed; Only rethrow if it's not a 404 style error
        const e = err as S3ServiceException;
        const code = e.$metadata?.httpStatusCode;
        const msg = (e.name || e.message || '').toLowerCase();
        if (
          code !== 404 &&
          !msg.includes('not found') &&
          !msg.includes('no such key') &&
          !msg.includes('404')
        ) {
          throw err;
        }
      }
    }
    const body = await fs.readFile(filePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      })
    );
  }

  // Wrangler support removed: S3-only uploads
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
      // S3-only: no --method flag
      .option('--access-key-id <id>', 'R2 Access Key ID (env R2_ACCESS_KEY_ID)')
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
      // S3-only: no --api-token flag
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
        accessKeyId:
          (options.accessKeyId as string) || process.env.R2_ACCESS_KEY_ID,
        secretAccessKey:
          (options.secretAccessKey as string) ||
          process.env.R2_SECRET_ACCESS_KEY,
        endpoint: (options.endpoint as string) || process.env.R2_ENDPOINT,
        accountId: (options.accountId as string) || cfConfig?.accountId,
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

  async init(config: EmmaConfigType) {
    // Interactive setup for Cloudflare R2
    const inquirerModule = await import('inquirer');
    const inquirer = inquirerModule.default || inquirerModule;
    console.log(chalk.cyan('\nCloudflare R2 Setup:'));
    const answers = (await inquirer.prompt([
      { type: 'input', name: 'bucket', message: 'R2 bucket name:' },
      {
        type: 'input',
        name: 'publicUrl',
        message:
          'Public base URL (e.g., https://<bucket>.r2.cloudflarestorage.com):',
      },
      {
        type: 'input',
        name: 'accountId',
        message: 'Cloudflare Account ID (optional, for deriving S3 endpoint):',
      },
    ])) as { bucket: string; publicUrl: string; accountId?: string };

    config.set('cloudflare', {
      bucket: answers.bucket,
      publicUrl: answers.publicUrl,
      accountId: answers.accountId || '',
    });
    await config.save();
    console.log(chalk.green('\nCloudflare R2 configuration saved!'));
    console.log(
      chalk.dim(
        'Note: Ensure R2 S3 credentials are set via env (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).'
      )
    );
  },
};
