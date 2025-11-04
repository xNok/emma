/**
 * Emma CLI End-to-End Test
 *
 * This test verifies the complete user workflow:
 * 1. Create a form using proper typed schema
 * 2. Build and deploy the form
 * 3. Access form in browser and verify it works
 * 4. Submit form data and verify API works
 */

import { test, expect } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import type { FormSchema } from '@xnok/emma-shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_PORT = 3335;
const TEST_HOST = 'localhost';
const EMMA_CLI_PATH = path.resolve(__dirname, '../../../dist/cli.js');

let emmaHomeDir: string;
let serverProcess: ChildProcess | null = null;

/**
 * Helper function to create properly typed FormSchema for tests
 */
function createTestFormSchema(
  formId: string,
  name: string,
  fields: FormSchema['fields'],
  timestamp: number
): FormSchema {
  return {
    formId,
    name,
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: `/api/submit/${formId}`,
    fields,
    settings: {
      submitButtonText: 'Submit Form',
      successMessage: 'Thank you!',
      errorMessage: 'Sorry, there was an error.',
    },
    snapshots: [
      {
        timestamp,
        r2Key: `${formId}-${timestamp}.js`,
        changes: 'Initial version',
      },
    ],
    currentSnapshot: timestamp,
  };
}

/**
 * Helper function to run Emma CLI commands with the temp EMMA_HOME
 */
function runEmmaCommand(command: string, args: string[] = []): string {
  return execSync(`node "${EMMA_CLI_PATH}" ${command} ${args.join(' ')}`, {
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      EMMA_HOME: emmaHomeDir,
    },
  });
}

/**
 * Helper function to spawn Emma CLI commands with the temp EMMA_HOME
 */
function spawnEmmaCommand(command: string, args: string[] = []): ChildProcess {
  return spawn('node', [EMMA_CLI_PATH, command, ...args], {
    stdio: 'pipe',
    env: {
      ...process.env,
      EMMA_HOME: emmaHomeDir,
    },
  });
}

test.describe('Emma CLI End-to-End Workflow', () => {
  test.beforeAll(async () => {
    // Create temporary directory for Emma home
    emmaHomeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'emma-e2e-'));
    console.log(`Test Emma home: ${emmaHomeDir}`);

    // Create Emma directory structure
    await fs.ensureDir(path.join(emmaHomeDir, 'forms'));
    await fs.ensureDir(path.join(emmaHomeDir, 'builds'));

    const config = {
      initialized: true,
      defaultTheme: 'default',
      localServerPort: 3333,
      localServerHost: 'localhost',
      formsDirectory: path.join(emmaHomeDir, 'forms'),
      buildsDirectory: path.join(emmaHomeDir, 'builds'),
    };

    await fs.writeJson(path.join(emmaHomeDir, 'config.json'), config, {
      spaces: 2,
    });
    console.log('✅ Created test Emma config');
  });

  test.afterAll(async () => {
    // Kill server if running
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Clean up temp directory
    await fs.remove(emmaHomeDir);
    console.log('✅ Cleaned up Emma home directory');
  });

  test('complete Emma workflow - create, build, deploy, and browser test', async ({
    page,
  }) => {
    // Step 1: Verify Emma config is ready
    console.log('Step 1: Verifying Emma CLI is ready...');
    expect(await fs.pathExists(emmaHomeDir)).toBe(true);
    console.log('✅ Emma CLI configuration ready');

    // Step 2: Create a test form with proper typing
    console.log('Step 2: Creating a test form...');
    const timestamp = Math.floor(Date.now() / 1000);
    const formId = `test-form-${timestamp}`;
    const formName = `Test Form ${timestamp}`;

    const formData = createTestFormSchema(
      formId,
      formName,
      [
        { id: 'name', type: 'text', label: 'Full Name', required: true },
        { id: 'email', type: 'email', label: 'Email Address', required: true },
        { id: 'message', type: 'textarea', label: 'Message', required: false },
      ],
      timestamp
    );

    // Write form schema
    const yaml = await import('js-yaml');
    const formContent = yaml.dump(formData);
    await fs.writeFile(
      path.join(emmaHomeDir, 'forms', `${formId}.yaml`),
      formContent
    );
    console.log(`✅ Form created successfully with ID: ${formId}`);

    // Step 3: Build the form
    console.log('Step 3: Building the form...');
    const buildOutput = runEmmaCommand('build', [formId]);

    expect(buildOutput).toContain('Build results:');
    expect(buildOutput).toContain('Bundle:');
    expect(buildOutput).toContain('Next steps:');
    console.log('✅ Form built successfully');

    // Verify build artifacts exist
    const buildsDir = path.join(emmaHomeDir, 'builds', formId);
    expect(await fs.pathExists(buildsDir)).toBe(true);

    const indexHtml = path.join(buildsDir, 'index.html');
    expect(await fs.pathExists(indexHtml)).toBe(true);

    // Step 4: Deploy the form locally
    console.log('Step 4: Deploying form locally...');

    serverProcess = spawnEmmaCommand('deploy', [
      'local',
      formId,
      '--port',
      TEST_PORT.toString(),
    ]);

    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Server failed to start')),
        15000
      );

      if (serverProcess?.stdout) {
        serverProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          console.log('Deploy output:', output);
          if (output.includes('Local deployment complete!')) {
            clearTimeout(timeout);
            resolve(void 0);
          }
        });
      }

      if (serverProcess?.stderr) {
        serverProcess.stderr.on('data', (data: Buffer) => {
          console.error('Deploy error:', data.toString());
        });
      }

      if (serverProcess) {
        serverProcess.on('error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      }
    });

    console.log('✅ Form deployed successfully');

    // Step 5: Test form in browser
    console.log('Step 5: Testing form in browser...');
    const formUrl = `http://${TEST_HOST}:${TEST_PORT}/forms/${formId}`;

    // Navigate to form
    await page.goto(formUrl);

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Check for JavaScript errors
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });

    // Wait a bit for JavaScript to load
    await page.waitForTimeout(2000);

    // Debug: check if the container exists and what's in it
    const containerExists = await page.locator('#form-container').count();
    console.log(`Form container found: ${containerExists}`);

    if (containerExists > 0) {
      const containerHTML = await page.locator('#form-container').innerHTML();
      console.log('Container content:', containerHTML);
    }

    // Verify page loads and form is present
    await expect(page).toHaveTitle(formName);
    await expect(page.locator('[data-emma-form]')).toBeVisible();

    // Check that form fields are present
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    console.log('✅ Form renders correctly in browser');

    // Step 6: Test form submission
    console.log('Step 6: Testing form submission...');

    await page.fill('input[type="text"]', 'John Doe');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('textarea', 'This is a test message from the E2E test.');

    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.emma-form-messages--success')).toBeVisible({
      timeout: 10000,
    });

    console.log('✅ Form submission works correctly');
    console.log('🎉 Complete Emma workflow test PASSED!');
  });

  test('provider registration works correctly', () => {
    console.log('Testing provider registration...');

    // Test that deploy command shows available providers
    const deployHelpOutput = runEmmaCommand('deploy', ['--help']);

    expect(deployHelpOutput).toContain('local');
    expect(deployHelpOutput).toContain('cloudflare');
    console.log('✅ Deploy command shows available providers');

    // Test that cloudflare provider help works
    const cloudflareHelpOutput = runEmmaCommand('deploy', [
      'cloudflare',
      '--help',
    ]);

    expect(cloudflareHelpOutput).toContain('Deploy to Cloudflare R2');
    expect(cloudflareHelpOutput).toContain('--bucket');
    expect(cloudflareHelpOutput).toContain('--public-url');
    console.log('✅ Cloudflare provider help works correctly');

    // Test that local provider help still works
    const localHelpOutput = runEmmaCommand('deploy', ['local', '--help']);

    expect(localHelpOutput).toContain('Deploy locally (simulation)');
    expect(localHelpOutput).toContain('--port');
    expect(localHelpOutput).toContain('--host');
    console.log('✅ Local provider help works correctly');

    console.log('✅ Provider registration works correctly');
  });
});
