/**
 * API Worker Deployment Utilities
 * Handles Cloudflare Worker deployment using Cloudflare API
 */

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';

export interface ApiWorkerDeploymentOptions {
  accountId: string;
  apiToken?: string; // Optional, can use CLOUDFLARE_API_TOKEN env var
  databaseName?: string; // D1 database name (default: emma-submissions)
  workerName?: string; // Worker name (default: emma-api)
  environment?: 'production' | 'staging' | 'development';
}

export interface ApiWorkerDeploymentResult {
  workerUrl: string;
  databaseId: string;
  databaseName: string;
  success: boolean;
  message: string;
}

export class ApiWorkerDeployment {
  private resourcesPath: string;
  private apiWorkerPath: string;

  constructor() {
    // Use migrations from the api-worker package
    try {
      // Try to require.resolve the api-worker package
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

    // Find the api-worker package installation
    // In production (npm install), it will be in node_modules
    // In development (monorepo), it will be a workspace dependency
    try {
      // Try to require.resolve the api-worker package
      const apiWorkerPackagePath = require.resolve(
        '@xnok/emma-api-worker/package.json'
      );
      this.apiWorkerPath = path.dirname(apiWorkerPackagePath);
    } catch (error) {
      // Fallback to monorepo structure for development
      this.apiWorkerPath = path.resolve(process.cwd(), 'packages/api-worker');
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
    const environment = options.environment || 'production';

    let spinner = ora('Setting up Cloudflare infrastructure...').start();

    try {
      // Step 1: Verify api-worker package is available
      if (!(await fs.pathExists(this.apiWorkerPath))) {
        throw new Error(
          `API worker package not found at ${this.apiWorkerPath}. ` +
            'Make sure @xnok/emma-api-worker is installed.'
        );
      }

      // Step 2: Create D1 database if it doesn't exist
      spinner.text = 'Creating D1 database...';
      const databaseId = await this.ensureD1Database(
        databaseName,
        options.accountId,
        apiToken
      );
      spinner.succeed(`D1 database ready: ${databaseName} (${databaseId})`);

      // Step 3: Run migrations (using bundled migrations from form-builder)
      spinner = ora('Running database migrations...').start();
      await this.runMigrations(databaseName, options.accountId, apiToken);
      spinner.succeed('Database migrations completed');

      // Step 4: Update wrangler.toml in api-worker package with database ID
      spinner = ora('Updating worker configuration...').start();
      await this.updateWranglerConfig(databaseId, databaseName, environment);
      spinner.succeed('Worker configuration updated');

      // Step 5: Deploy the worker from api-worker package
      spinner = ora('Deploying API worker to Cloudflare...').start();
      const workerUrl = await this.deployWorker(
        environment,
        apiToken,
        options.accountId
      );
      spinner.succeed(`API worker deployed: ${workerUrl}`);

      return {
        workerUrl,
        databaseId,
        databaseName,
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
   * Returns the database ID
   */
  private async ensureD1Database(
    databaseName: string,
    accountId: string,
    apiToken: string
  ): Promise<string> {
    // First, try to list existing databases
    const databases = await this.listD1Databases(accountId, apiToken);
    const existing = databases.find((db) => db.name === databaseName);

    if (existing) {
      return existing.uuid;
    }

    // Database doesn't exist, create it
    const createResult = await this.createD1Database(
      databaseName,
      accountId,
      apiToken
    );
    return createResult.uuid;
  }

  /**
   * Run database migrations
   */
  private async runMigrations(
    databaseName: string,
    accountId: string,
    apiToken: string
  ): Promise<void> {
    const migrationsDir = path.join(this.resourcesPath, 'migrations');

    if (!(await fs.pathExists(migrationsDir))) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    // Get all migration files
    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // Execute each migration
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      const sql = await fs.readFile(migrationPath, 'utf-8');

      // Split SQL into individual statements and execute them separately
      // This allows for better error handling and idempotency
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await this.executeD1Query(
            databaseName,
            statement,
            accountId,
            apiToken
          );
        } catch (error) {
          // For DDL statements like ALTER TABLE, ignore "already exists" errors
          if (
            statement.toUpperCase().includes('ALTER TABLE') &&
            error instanceof Error &&
            (error.message.includes('duplicate column name') ||
              error.message.includes('already exists'))
          ) {
            // Column already exists, continue
            continue;
          }
          // Re-throw other errors
          throw error;
        }
      }
    }
  }

  /**
   * Update wrangler.toml in api-worker package with database configuration
   */
  private async updateWranglerConfig(
    databaseId: string,
    databaseName: string,
    _environment: string
  ): Promise<void> {
    const wranglerPath = path.join(this.apiWorkerPath, 'wrangler.toml');

    if (!(await fs.pathExists(wranglerPath))) {
      throw new Error(
        `wrangler.toml not found at ${wranglerPath}. ` +
          'Make sure the api-worker package is properly installed.'
      );
    }

    let content = await fs.readFile(wranglerPath, 'utf-8');

    // Update database_id in the D1 database binding
    content = content.replace(
      /database_id\s*=\s*"[^"]*"/,
      `database_id = "${databaseId}"`
    );

    // Ensure database_name matches
    content = content.replace(
      /database_name\s*=\s*"[^"]*"/,
      `database_name = "${databaseName}"`
    );

    await fs.writeFile(wranglerPath, content, 'utf-8');
  }

  /**
   * Deploy the worker using Cloudflare API
   */
  private async deployWorker(
    environment: string,
    apiToken: string,
    accountId: string
  ): Promise<string> {
    const workerName =
      environment && environment !== 'production'
        ? `emma-api-${environment}`
        : 'emma-api';

    // Read the worker script from Nitro's output
    const scriptPath = path.join(
      this.apiWorkerPath,
      '.output',
      'server',
      'index.mjs'
    );
    if (!(await fs.pathExists(scriptPath))) {
      throw new Error(
        `Worker script not found at ${scriptPath}. ` +
          'Please run "yarn build:cloudflare" in the api-worker package first.'
      );
    }
    const script = await fs.readFile(scriptPath, 'utf-8');

    // Deploy using Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/javascript',
        },
        body: script,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Worker deployment failed: ${response.status} ${error}`);
    }

    return `https://${workerName}.${accountId}.workers.dev`;
  }

  /**
   * List D1 databases using Cloudflare API
   */
  private async listD1Databases(
    accountId: string,
    apiToken: string
  ): Promise<Array<{ name: string; uuid: string }>> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to list D1 databases: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      result: Array<{ name: string; uuid: string }>;
    };
    return data.result || [];
  }

  /**
   * Create D1 database using Cloudflare API
   */
  private async createD1Database(
    databaseName: string,
    accountId: string,
    apiToken: string
  ): Promise<{ uuid: string }> {
    const response = await fetch(
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to create D1 database: ${response.status} ${error}`
      );
    }

    const data = (await response.json()) as { result: { uuid: string } };
    return data.result;
  }

  /**
   * Execute D1 query using Cloudflare API
   */
  private async executeD1Query(
    databaseName: string,
    sql: string,
    accountId: string,
    apiToken: string
  ): Promise<void> {
    // First get the database UUID
    const databases = await this.listD1Databases(accountId, apiToken);
    const database = databases.find((db) => db.name === databaseName);
    if (!database) {
      throw new Error(`Database ${databaseName} not found`);
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${database.uuid}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to execute D1 query: ${response.status} ${error}`
      );
    }

    const data = (await response.json()) as {
      result: Array<{ error?: string }>;
    };
    if (data.result.some((r) => r.error)) {
      throw new Error(`D1 query error: ${JSON.stringify(data.result)}`);
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
}
