/**
 * API Worker Deployment Utilities
 * Handles Cloudflare Worker deployment using Cloudflare REST API
 */

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import { resolveApiWorker, getApiWorkerVersion } from '@xnok/emma-shared';

export interface ApiWorkerDeploymentOptions {
  accountId: string;
  apiToken?: string; // Optional, can use CLOUDFLARE_API_TOKEN env var
  databaseName?: string; // D1 database name (default: emma-submissions)
  kvNamespaceName?: string; // KV namespace name (default: emma-schema-cache)
  workerName?: string; // Worker name (default: emma-api)
  environment?: 'production' | 'staging' | 'development';
}

export interface ApiWorkerDeploymentResult {
  workerUrl: string;
  databaseId: string;
  databaseName: string;
  kvNamespaceId: string;
  workerVersion: string;
  success: boolean;
  message: string;
}

export class ApiWorkerDeployment {
  private resourcesPath: string;

  constructor() {
    // Use migrations from the api-worker package
    try {
      const apiWorkerPackagePath = require.resolve(
        '@xnok/emma-api-worker/package.json'
      );
      this.resourcesPath = path.join(path.dirname(apiWorkerPackagePath), 'src');
    } catch (error) {
      // Fallback to monorepo structure for development
      this.resourcesPath = path.resolve(
        process.cwd(),
        'packages/api-worker/src'
      );
    }
  }

  /**
   * Deploy the API worker to Cloudflare
   */
  async deploy(
    options: ApiWorkerDeploymentOptions
  ): Promise<ApiWorkerDeploymentResult> {
    // Validate options
    if (!options.accountId) {
      throw new Error('Cloudflare Account ID is required');
    }

    const apiToken = options.apiToken || process.env.CLOUDFLARE_API_TOKEN;
    if (!apiToken) {
      throw new Error(
        'CLOUDFLARE_API_TOKEN environment variable is required or provide --api-token'
      );
    }

    const databaseName = options.databaseName || 'emma-submissions';
    const kvNamespaceName = options.kvNamespaceName || 'emma-schema-cache';
    const environment = options.environment || 'production';
    const workerName =
      options.workerName ||
      (environment && environment !== 'production'
        ? `emma-api-${environment}`
        : 'emma-api');

    let spinner = ora('Setting up Cloudflare infrastructure...').start();

    try {
      // Step 1: Ensure D1 database exists
      spinner.text = 'Creating D1 database...';
      const databaseId = await this.ensureD1Database(
        apiToken,
        databaseName,
        options.accountId
      );
      spinner.succeed(`D1 database ready: ${databaseName} (${databaseId})`);

      // Step 2: Run migrations
      spinner = ora('Running database migrations...').start();
      await this.runMigrations(apiToken, databaseName, options.accountId);
      spinner.succeed('Database migrations completed');

      // Step 3: Ensure KV namespace exists
      spinner = ora('Creating KV namespace...').start();
      const kvNamespaceId = await this.ensureKVNamespace(
        apiToken,
        kvNamespaceName,
        options.accountId
      );
      spinner.succeed(
        `KV namespace ready: ${kvNamespaceName} (${kvNamespaceId})`
      );

      // Step 4: Resolve the pre-built worker script
      spinner = ora('Resolving API worker package...').start();
      const workerResolution = await resolveApiWorker({
        platform: 'cloudflare',
      });

      spinner.succeed(
        `API worker resolved: v${workerResolution.packageVersion}`
      );
      console.log(chalk.dim(`  Script path: ${workerResolution.scriptPath}`));

      // Step 5: Deploy the worker using Cloudflare API (simplified approach)
      spinner = ora('Deploying API worker to Cloudflare...').start();

      // Upload worker script using the REST API directly
      const uploadResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/workers/scripts/${workerName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/javascript+module',
          },
          body: workerResolution.scriptContent,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(
          `Worker upload failed: ${uploadResponse.status} ${error}`
        );
      }

      // Configure worker bindings using REST API
      const bindingsResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/workers/scripts/${workerName}/settings`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bindings: [
              {
                type: 'd1',
                name: 'DB',
                id: databaseId,
              },
              {
                type: 'kv_namespace',
                name: 'SCHEMA_CACHE',
                namespace_id: kvNamespaceId,
              },
            ],
          }),
        }
      );

      if (!bindingsResponse.ok) {
        const error = await bindingsResponse.text();
        throw new Error(
          `Worker bindings configuration failed: ${bindingsResponse.status} ${error}`
        );
      }

      const workerUrl = `https://${workerName}.${options.accountId}.workers.dev`;
      spinner.succeed(`API worker deployed: ${workerUrl}`);

      return {
        workerUrl,
        databaseId,
        databaseName,
        kvNamespaceId,
        workerVersion: workerResolution.packageVersion,
        success: true,
        message: 'API worker deployed successfully',
      };
    } catch (error) {
      spinner?.fail('API worker deployment failed');
      throw error;
    }
  }

  /**
   * Ensure D1 database exists, create if it doesn't
   */
  private async ensureD1Database(
    apiToken: string,
    databaseName: string,
    accountId: string
  ): Promise<string> {
    // List existing databases using REST API
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error(`Failed to list D1 databases: ${listResponse.status}`);
    }

    const listData = (await listResponse.json()) as {
      result: Array<{ name: string; uuid: string }>;
    };
    const existing = listData.result?.find((db) => db.name === databaseName);

    if (existing && existing.uuid) {
      return existing.uuid;
    }

    // Database doesn't exist, create it using REST API
    const createResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: databaseName }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create D1 database: ${createResponse.status} ${error}`);
    }

    const createData = (await createResponse.json()) as {
      result: { uuid: string };
    };

    if (!createData.result?.uuid) {
      throw new Error('Failed to create D1 database');
    }

    return createData.result.uuid;
  }

  /**
   * Ensure KV namespace exists, create if it doesn't
   */
  private async ensureKVNamespace(
    apiToken: string,
    namespaceName: string,
    accountId: string
  ): Promise<string> {
    // List existing namespaces using REST API
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error(`Failed to list KV namespaces: ${listResponse.status}`);
    }

    const listData = (await listResponse.json()) as {
      result: Array<{ title: string; id: string }>;
    };
    const existing = listData.result?.find((ns) => ns.title === namespaceName);

    if (existing && existing.id) {
      return existing.id;
    }

    // Namespace doesn't exist, create it using REST API
    const createResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: namespaceName }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create KV namespace: ${createResponse.status} ${error}`);
    }

    const createData = (await createResponse.json()) as {
      result: { id: string };
    };

    if (!createData.result?.id) {
      throw new Error('Failed to create KV namespace');
    }

    return createData.result.id;
  }

  /**
   * Run database migrations
   */
  private async runMigrations(
    apiToken: string,
    databaseName: string,
    accountId: string
  ): Promise<void> {
    const migrationsDir = path.join(this.resourcesPath, 'migrations');

    if (!(await fs.pathExists(migrationsDir))) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    // Get database UUID using REST API
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error(`Failed to list D1 databases: ${listResponse.status}`);
    }

    const listData = (await listResponse.json()) as {
      result: Array<{ name: string; uuid: string }>;
    };
    const database = listData.result?.find((db) => db.name === databaseName);
    
    if (!database || !database.uuid) {
      throw new Error(`Database ${databaseName} not found`);
    }

    // Get all migration files
    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // Execute each migration
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      const sql = await fs.readFile(migrationPath, 'utf-8');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          const queryResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${database.uuid}/query`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sql: statement }),
            }
          );

          if (!queryResponse.ok) {
            const error = await queryResponse.text();
            throw new Error(`Failed to execute D1 query: ${queryResponse.status} ${error}`);
          }
        } catch (error) {
          // Ignore "already exists" errors for idempotency
          if (
            statement.toUpperCase().includes('ALTER TABLE') &&
            error instanceof Error &&
            (error.message.includes('duplicate column name') ||
              error.message.includes('already exists'))
          ) {
            continue;
          }
          throw error;
        }
      }
    }
  }

  /**
   * Validate environment variables required for deployment
   */
  static validateEnvironment(): {
    valid: boolean;
    missing: string[];
    warnings: string[];
  } {
    const required = ['CLOUDFLARE_API_TOKEN'];
    const recommended = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];

    const missing: string[] = [];
    const warnings: string[] = [];

    for (const envVar of required) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    for (const envVar of recommended) {
      if (!process.env[envVar]) {
        warnings.push(envVar);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * Display environment variable setup instructions
   */
  static displayEnvSetupInstructions(): void {
    console.log('');
    console.log(chalk.cyan('Required Environment Variables:'));
    console.log('');
    console.log(chalk.white('  CLOUDFLARE_API_TOKEN'));
    console.log(
      chalk.dim(
        '    Create a token at: https://dash.cloudflare.com/profile/api-tokens'
      )
    );
    console.log(
      chalk.dim(
        '    Required permissions: Account - Workers Scripts (Edit), D1 (Edit)'
      )
    );
    console.log('');
    console.log(
      chalk.cyan('Recommended Environment Variables (for form deployment):')
    );
    console.log('');
    console.log(chalk.white('  R2_ACCESS_KEY_ID'));
    console.log(chalk.white('  R2_SECRET_ACCESS_KEY'));
    console.log(
      chalk.dim(
        '    Create R2 API tokens at: https://dash.cloudflare.com/[account]/r2/api-tokens'
      )
    );
    console.log('');
    console.log(chalk.cyan('Example setup:'));
    console.log('');
    console.log(chalk.white('  export CLOUDFLARE_API_TOKEN="your-api-token"'));
    console.log(chalk.white('  export R2_ACCESS_KEY_ID="your-access-key-id"'));
    console.log(chalk.white('  export R2_SECRET_ACCESS_KEY="your-secret-key"'));
    console.log('');
  }

  /**
   * Get the currently installed API worker version
   */
  static async getInstalledVersion(): Promise<string | null> {
    return getApiWorkerVersion();
  }
}
