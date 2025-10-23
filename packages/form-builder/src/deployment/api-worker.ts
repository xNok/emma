/**
 * API Worker Deployment Utilities
 * Handles Cloudflare Worker deployment using Wrangler
 */

import { spawn } from 'child_process';
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
    // Use bundled resources (migrations) from the form-builder package
    // This works both in dev (src/resources) and production (dist/resources)
    const isDev = __filename.includes('/src/');
    const basePath = isDev
      ? path.resolve(__dirname, '..')
      : path.resolve(__dirname, '..');
    this.resourcesPath = path.join(basePath, 'resources');

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
      await this.runMigrations(databaseName, apiToken);
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
    const listResult = await this.runWranglerCommand(['d1', 'list', '--json'], {
      CLOUDFLARE_API_TOKEN: apiToken,
      CLOUDFLARE_ACCOUNT_ID: accountId,
    });

    try {
      const databases = JSON.parse(listResult.stdout);
      const existing = databases.find(
        (db: { name: string; uuid: string }) => db.name === databaseName
      );

      if (existing) {
        return existing.uuid;
      }
    } catch (error) {
      // If JSON parsing fails or no databases exist, continue to create
    }

    // Database doesn't exist, create it
    const createResult = await this.runWranglerCommand(
      ['d1', 'create', databaseName, '--json'],
      { CLOUDFLARE_API_TOKEN: apiToken, CLOUDFLARE_ACCOUNT_ID: accountId }
    );

    const createData = JSON.parse(createResult.stdout);
    return createData.uuid || createData.database_id;
  }

  /**
   * Run database migrations
   */
  private async runMigrations(
    databaseName: string,
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

      await this.runWranglerCommand(
        ['d1', 'execute', databaseName, '--file', migrationPath, '--remote'],
        { CLOUDFLARE_API_TOKEN: apiToken }
      );
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
   * Deploy the worker using wrangler from api-worker package
   */
  private async deployWorker(
    environment: string,
    apiToken: string,
    accountId: string
  ): Promise<string> {
    const envFlag =
      environment && environment !== 'production' ? ['--env', environment] : [];

    const result = await this.runWranglerCommand(
      ['deploy', ...envFlag],
      {
        CLOUDFLARE_API_TOKEN: apiToken,
        CLOUDFLARE_ACCOUNT_ID: accountId,
      },
      this.apiWorkerPath
    );

    // Extract worker URL from output
    // Wrangler typically outputs: "Published emma-api (X.X.X)"
    // and "https://emma-api.your-subdomain.workers.dev"
    const urlMatch =
      result.stdout.match(/https:\/\/[^\s]+\.workers\.dev/) ||
      result.stderr.match(/https:\/\/[^\s]+\.workers\.dev/);

    if (urlMatch) {
      return urlMatch[0];
    }

    // If we can't find the URL, construct it
    const workerName =
      environment && environment !== 'production'
        ? `emma-api-${environment}`
        : 'emma-api';
    return `https://${workerName}.${accountId}.workers.dev`;
  }

  /**
   * Run a wrangler command and return the result
   */
  private runWranglerCommand(
    args: string[],
    env: Record<string, string>,
    cwd?: string
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      // Try to use yarn/npx to run wrangler, which handles Yarn PnP properly
      const useYarn = process.env.npm_config_user_agent?.includes('yarn');
      const command = useYarn ? 'yarn' : 'npx';
      const fullArgs = ['wrangler', ...args];

      const proc = spawn(command, fullArgs, {
        cwd: cwd || process.cwd(),
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Wrangler command failed with code ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`
            )
          );
        } else {
          resolve({ stdout, stderr });
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to execute wrangler: ${error.message}`));
      });
    });
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
