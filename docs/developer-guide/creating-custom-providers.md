# Creating Custom Providers

This guide walks through creating a custom deployment provider for Emma Forms. We'll build a complete AWS S3 provider as an example.

## Prerequisites

- Node.js 18+
- TypeScript knowledge
- Understanding of the target platform's APIs (AWS S3, etc.)

## 1. Project Setup

### 1.1 Create Provider Package

```bash
# Create new provider package
mkdir packages/provider-aws-s3
cd packages/provider-aws-s3

# Initialize package
npm init -y
npm install -D typescript @types/node vitest
npm install @aws-sdk/client-s3 @xnok/emma-shared commander chalk ora
```

### 1.2 Package Configuration

**package.json:**

```json
{
  "name": "@xnok/emma-provider-aws-s3",
  "version": "0.1.0",
  "description": "AWS S3 deployment provider for Emma Forms",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": ["emma", "forms", "aws", "s3", "deployment"],
  "author": "Your Name",
  "license": "MIT"
}
```

**tsconfig.json:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 2. Provider Implementation

### 2.1 Define Types

**src/types.ts:**

```typescript
import type { ProviderOptions } from '@xnok/emma-shared/types';

/**
 * AWS S3 specific deployment options
 */
export interface AwsS3DeploymentOptions extends ProviderOptions {
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
  overwrite?: boolean;
  snapshot?: string;
}

/**
 * Result of a deployment operation
 */
export interface AwsS3DeploymentResult {
  success: boolean;
  bundleUrl?: string;
  themeUrl?: string;
  message?: string;
}

/**
 * Configuration interface for Emma
 */
export interface EmmaConfigInterface {
  isInitialized(): boolean;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  save(): Promise<void>;
  loadFormSchema(formId: string): Promise<any>;
}
```

### 2.2 Implement Deployment Logic

**src/deploy.ts:**

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type {
  AwsS3DeploymentOptions,
  AwsS3DeploymentResult,
  EmmaConfigInterface,
} from './types.js';
import { readFile } from 'fs/promises';
import path from 'path';

export class AwsS3Deployment {
  private s3Client: S3Client;

  constructor(private config: EmmaConfigInterface) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async deploy(
    formId: string,
    options: AwsS3DeploymentOptions
  ): Promise<AwsS3DeploymentResult> {
    try {
      // Validate options
      this.validateOptions(options);

      // Load form schema to get build info
      const schema = await this.config.loadFormSchema(formId);
      if (!schema) {
        throw new Error(`Form "${formId}" not found`);
      }

      // Build paths
      const buildDir = path.join(process.cwd(), '.emma', 'build', formId);
      const bundlePath = path.join(buildDir, 'bundle.js');
      const themePath = path.join(buildDir, 'theme.css');

      // Upload bundle
      const bundleKey = `forms/${formId}/bundle.js`;
      await this.uploadFile(
        bundlePath,
        options.bucket!,
        bundleKey,
        'application/javascript'
      );

      // Upload theme (if exists)
      let themeUrl: string | undefined;
      try {
        await readFile(themePath);
        const themeKey = `forms/${formId}/theme.css`;
        await this.uploadFile(themePath, options.bucket!, themeKey, 'text/css');
        themeUrl = `https://${options.bucket}.s3.${this.s3Client.config.region}.amazonaws.com/${themeKey}`;
      } catch {
        // Theme file doesn't exist, skip
      }

      const bundleUrl = `https://${options.bucket}.s3.${this.s3Client.config.region}.amazonaws.com/${bundleKey}`;

      return {
        success: true,
        bundleUrl,
        themeUrl,
        message: `Form "${formId}" deployed successfully to AWS S3`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async uploadFile(
    filePath: string,
    bucket: string,
    key: string,
    contentType: string
  ): Promise<void> {
    const fileContent = await readFile(filePath);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'public-read', // Make files publicly accessible
    });

    await this.s3Client.send(command);
  }

  private validateOptions(options: AwsS3DeploymentOptions): void {
    if (!options.bucket) {
      throw new Error('--bucket is required for AWS S3 deployment');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        'AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
      );
    }
  }
}
```

### 2.3 Create Provider Definition

**src/provider.ts:**

```typescript
import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type {
  DeploymentProviderDefinition,
  ProviderOptions,
} from '@xnok/emma-shared/types';
import { AwsS3Deployment } from './deploy.js';
import type { AwsS3DeploymentOptions, EmmaConfigInterface } from './types.js';

/**
 * Form Manager interface - minimal interface needed for deployment
 */
export interface FormManagerInterface {
  ensureBuilt(formId: string): Promise<void>;
}

/**
 * Create the AWS S3 deployment provider definition
 */
export function createAwsS3Provider(
  FormManagerClass?: new (config: EmmaConfigInterface) => FormManagerInterface
): DeploymentProviderDefinition<Command, EmmaConfigInterface> {
  return {
    name: 'aws-s3',
    description: 'Deploy to AWS S3',
    capabilities: ['deploy'],

    register(parent: Command, config: EmmaConfigInterface) {
      parent
        .command('aws-s3')
        .description(this.description)
        .argument('<form-id>', 'Form ID to deploy')
        .option('--bucket <name>', 'AWS S3 bucket name')
        .option('--region <region>', 'AWS region (defaults to us-east-1)')
        .option(
          '--access-key-id <id>',
          'AWS Access Key ID (env AWS_ACCESS_KEY_ID)'
        )
        .option(
          '--secret-access-key <key>',
          'AWS Secret Access Key (env AWS_SECRET_ACCESS_KEY)'
        )
        .option('--public-url <url>', 'Custom public URL for the bucket')
        .option('--overwrite', 'Overwrite existing objects in S3', false)
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

      const spinner = ora('Building and deploying form (AWS S3)...').start();

      try {
        // If FormManagerClass was provided, use it to ensure the form is built
        if (FormManagerClass) {
          const manager = new FormManagerClass(config);
          await manager.ensureBuilt(formId);
        }

        // Create deployment instance
        const deployment = new AwsS3Deployment(config);

        // Merge CLI options with config
        const deploymentOptions: AwsS3DeploymentOptions = {
          bucket:
            (options.bucket as string) ||
            (config.get('aws-s3.bucket') as string),
          region:
            (options.region as string) ||
            (config.get('aws-s3.region') as string) ||
            'us-east-1',
          accessKeyId:
            (options.accessKeyId as string) || process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey:
            (options.secretAccessKey as string) ||
            process.env.AWS_SECRET_ACCESS_KEY,
          publicUrl:
            (options.publicUrl as string) ||
            (config.get('aws-s3.publicUrl') as string),
          overwrite: options.overwrite as boolean,
          snapshot: options.snapshot as string,
        };

        // Execute deployment
        const result = await deployment.deploy(formId, deploymentOptions);

        if (result.success) {
          spinner.succeed(result.message);
          if (result.bundleUrl) {
            console.log(chalk.green(`Bundle URL: ${result.bundleUrl}`));
          }
          if (result.themeUrl) {
            console.log(chalk.green(`Theme URL: ${result.themeUrl}`));
          }
        } else {
          spinner.fail(result.message || 'Deployment failed');
          process.exit(1);
        }
      } catch (error) {
        spinner.fail(
          `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    },

    async init(
      config: EmmaConfigInterface
    ): Promise<{ success: boolean; message?: string }> {
      console.log(chalk.blue('Initializing AWS S3 provider...'));

      // Interactive setup would go here
      // For now, just validate environment
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        return {
          success: false,
          message:
            'AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
        };
      }

      // Save default region if provided
      const region = process.env.AWS_REGION || 'us-east-1';
      config.set('aws-s3', { region });

      return {
        success: true,
        message: 'AWS S3 provider initialized successfully',
      };
    },

    async checkReadiness(
      config: EmmaConfigInterface
    ): Promise<{ ready: boolean; issues?: string[] }> {
      const issues: string[] = [];

      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        issues.push('AWS credentials not set in environment variables');
      }

      const awsConfig = config.get('aws-s3') as any;
      if (!awsConfig?.bucket) {
        issues.push('AWS S3 bucket not configured');
      }

      return {
        ready: issues.length === 0,
        issues,
      };
    },
  };
}

// Export the provider object directly for simpler imports
export const awsS3Provider = createAwsS3Provider();
```

### 2.4 Create Main Export

**src/index.ts:**

```typescript
/**
 * AWS S3 Provider for Emma Forms
 */

import type { ProviderManifest } from '@xnok/emma-shared/types';

// Export deployment implementation
export {
  AwsS3Deployment,
  createAwsS3Provider,
  awsS3Provider,
} from './provider.js';
export type { AwsS3DeploymentOptions, AwsS3DeploymentResult } from './types.js';

/**
 * Provider manifest for AWS S3
 */
export const awsS3ProviderManifest: ProviderManifest = {
  name: 'aws-s3',
  displayName: 'AWS S3',
  description: 'Deploy forms to AWS S3 buckets',
  packageName: '@xnok/emma-provider-aws-s3',
  version: '0.1.0',
  capabilities: ['deploy'],
  async isAvailable() {
    // Check if AWS credentials are available
    return !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );
  },
};
```

## 3. Testing

### 3.1 Unit Tests

**src/deploy.test.ts:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AwsS3Deployment } from './deploy.js';
import type { EmmaConfigInterface } from './types.js';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    config: { region: 'us-east-1' },
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
}));

describe('AwsS3Deployment', () => {
  let mockConfig: EmmaConfigInterface;

  beforeEach(() => {
    mockConfig = {
      isInitialized: vi.fn().mockReturnValue(true),
      get: vi.fn(),
      set: vi.fn(),
      save: vi.fn(),
      loadFormSchema: vi.fn().mockResolvedValue({
        formId: 'test-form',
        name: 'Test Form',
      }),
    };

    // Set up environment variables
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
  });

  it('should deploy successfully', async () => {
    const deployment = new AwsS3Deployment(mockConfig);
    const result = await deployment.deploy('test-form', {
      bucket: 'test-bucket',
    });

    expect(result.success).toBe(true);
    expect(result.bundleUrl).toContain('test-bucket');
  });

  it('should fail without bucket', async () => {
    const deployment = new AwsS3Deployment(mockConfig);

    await expect(deployment.deploy('test-form', {})).rejects.toThrow(
      '--bucket is required'
    );
  });
});
```

### 3.2 Provider Tests

**src/provider.test.ts:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAwsS3Provider } from './provider.js';
import type { EmmaConfigInterface } from './types.js';

describe('AWS S3 Provider', () => {
  let mockConfig: EmmaConfigInterface;

  beforeEach(() => {
    mockConfig = {
      isInitialized: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue('test-bucket'),
      set: vi.fn(),
      save: vi.fn(),
      loadFormSchema: vi.fn().mockResolvedValue({
        formId: 'test-form',
        name: 'Test Form',
      }),
    };
  });

  it('should have correct provider definition', () => {
    const provider = createAwsS3Provider();

    expect(provider.name).toBe('aws-s3');
    expect(provider.description).toBe('Deploy to AWS S3');
    expect(provider.capabilities).toContain('deploy');
  });

  it('should check readiness successfully', async () => {
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

    const provider = createAwsS3Provider();
    const result = await provider.checkReadiness?.(mockConfig);

    expect(result?.ready).toBe(true);
  });
});
```

## 4. Documentation

### 4.1 README

**README.md:**

````markdown
# Emma AWS S3 Provider

Deploy Emma forms to AWS S3 buckets.

## Installation

```bash
npm install @xnok/emma-provider-aws-s3
```
````

## Configuration

### Environment Variables

Set the following environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
```

### Emma Configuration

Initialize the provider:

```bash
emma init --provider aws-s3
```

Or configure manually in `~/.emma/config.json`:

```json
{
  "aws-s3": {
    "bucket": "my-emma-forms",
    "region": "us-east-1"
  }
}
```

## Usage

Deploy a form:

```bash
emma deploy my-form --target aws-s3 --bucket my-emma-forms
```

## S3 Bucket Setup

1. Create an S3 bucket
2. Configure public read access for static website hosting
3. Enable static website hosting if needed
4. Note the bucket's public URL

## Permissions

Your AWS credentials need the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

````

## 5. Integration

### 5.1 Add to Built-in Providers

Update `shared/types/index.ts`:

```typescript
export const BUILT_IN_PROVIDERS = [
  '@xnok/emma-provider-cloudflare',
  '@xnok/emma-provider-aws-s3',
] as const;
````

### 5.2 Build and Test

```bash
# Build the provider
npm run build

# Run tests
npm test

# Link for local testing
npm link
cd ../form-builder
npm link @xnok/emma-provider-aws-s3
```

## 6. Advanced Features

### 6.1 Custom Domain Support

Add CloudFront distribution support for custom domains.

### 6.2 CDN Invalidation

Implement cache invalidation for updated forms.

### 6.3 Versioned Deployments

Support deploying to versioned paths for rollback capabilities.

## 7. Publishing

```bash
# Build and publish
npm run build
npm publish --access public
```

## Common Issues

### Credentials Not Found

Ensure AWS credentials are set in environment variables or AWS credentials file.

### Bucket Permissions

Verify the AWS user has `s3:PutObject` permissions on the target bucket.

### Public Access

Ensure the bucket policy allows public read access for static files.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

```</content>
<parameter name="filePath">/workspaces/emma/docs/developer-guide/creating-custom-providers.md
```
