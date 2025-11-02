/**
 * Emma CLI End-to-End Test
 * 
 * This test verifies the complete user workflow:
 * 1. Initialize Emma CLI
 * 2. Create a form using CLI
 * 3. Build and deploy the form
 * 4. Access form in browser and verify it works
 * 5. Submit form data and verify API works
 * 
 * This is the critical test that must always pass - it represents
 * the core Emma user experience end-to-end.
 */

import { test, expect } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_PORT = 3335; // Avoid conflicts with other services
const TEST_HOST = 'localhost';
const EMMA_CLI_PATH = path.resolve(__dirname, '../../../dist/cli.js');

let tempDir: string;
let serverProcess: ChildProcess | null = null;

test.describe('Emma CLI End-to-End Workflow', () => {
  test.beforeAll(async () => {
    // Create temporary directory for test
    tempDir = await fs.mkdtemp(path.join(process.cwd(), 'test-emma-e2e-'));
    console.log(`Test directory: ${tempDir}`);

    // Set HOME to temp directory so Emma config goes there
    process.env.HOME = tempDir;
    process.env.USERPROFILE = tempDir; // Windows support
  });

  test.afterAll(async () => {
    // Kill server if running
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      // Give it time to shut down
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clean up temp directory
    await fs.remove(tempDir);
    console.log(`Cleaned up test directory: ${tempDir}`);
  });

  test('complete Emma workflow - init, create, build, deploy, and browser test', async ({ page }) => {
    // Step 1: Initialize Emma CLI
    console.log('Step 1: Initializing Emma CLI...');
    
    const initOutput = execSync(`node "${EMMA_CLI_PATH}" init`, {
      cwd: tempDir,
      encoding: 'utf8',
      input: '\n\n\nDeploy locally (simulation)\n', // Default answers
      timeout: 30000
    });
    
    expect(initOutput).toContain('Emma CLI initialized successfully!');
    console.log('✅ Emma CLI initialized');

    // Verify Emma directory was created
    const emmaDir = path.join(tempDir, '.emma');
    expect(await fs.pathExists(emmaDir)).toBe(true);

    // Step 2: Create a form
    console.log('Step 2: Creating a test form...');
    
    const formName = `test-form-${Date.now()}`;
    const createOutput = execSync(`node "${EMMA_CLI_PATH}" create ${formName}`, {
      cwd: tempDir,
      encoding: 'utf8',
      input: '\ndefault\nname\ntext\nFull Name\ny\n\nemail\nemail\nEmail Address\ny\n\nmessage\ntextarea\nMessage\ny\n\nn\nSubmit Form\nThank you!\nSorry, there was an error.\n',
      timeout: 30000
    });

    expect(createOutput).toContain('Form created successfully!');
    console.log('✅ Form created successfully');

    // Get the generated form ID from the output
    const formIdMatch = createOutput.match(/Form ID: ([^\s\n]+)/);
    expect(formIdMatch).toBeTruthy();
    const formId = formIdMatch![1];
    console.log(`Generated form ID: ${formId}`);

    // Step 3: Build the form
    console.log('Step 3: Building the form...');
    
    const buildOutput = execSync(`node "${EMMA_CLI_PATH}" build ${formId}`, {
      cwd: tempDir,
      encoding: 'utf8',
      timeout: 30000
    });

    expect(buildOutput).toContain('Form bundle built successfully');
    console.log('✅ Form built successfully');

    // Verify build artifacts exist
    const buildsDir = path.join(emmaDir, 'builds', formId);
    expect(await fs.pathExists(buildsDir)).toBe(true);
    
    const indexHtml = path.join(buildsDir, 'index.html');
    expect(await fs.pathExists(indexHtml)).toBe(true);

    // Step 4: Deploy the form locally
    console.log('Step 4: Deploying form locally...');
    
    // Start deployment in background
    serverProcess = spawn('node', [EMMA_CLI_PATH, 'deploy', formId, '--port', TEST_PORT.toString()], {
      cwd: tempDir,
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server failed to start')), 15000);
      
      serverProcess!.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('Deploy output:', output);
        if (output.includes('Local deployment complete!')) {
          clearTimeout(timeout);
          resolve(void 0);
        }
      });

      serverProcess!.stderr?.on('data', (data) => {
        console.error('Deploy error:', data.toString());
      });

      serverProcess!.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log('✅ Form deployed successfully');

    // Step 5: Test form in browser
    console.log('Step 5: Testing form in browser...');
    
    const formUrl = `http://${TEST_HOST}:${TEST_PORT}/forms/${formId}`;
    
    // Navigate to form
    await page.goto(formUrl);
    
    // Verify page loads and form is present
    await expect(page).toHaveTitle(`${formName}`);
    await expect(page.locator('[data-emma-form]')).toBeVisible();
    
    // Check that form fields are present
    await expect(page.locator('input[type="text"]')).toBeVisible(); // Name field
    await expect(page.locator('input[type="email"]')).toBeVisible(); // Email field  
    await expect(page.locator('textarea')).toBeVisible(); // Message field
    await expect(page.locator('button[type="submit"]')).toBeVisible(); // Submit button

    console.log('✅ Form renders correctly in browser');

    // Step 6: Test form submission
    console.log('Step 6: Testing form submission...');
    
    // Fill out the form
    await page.fill('input[type="text"]', 'John Doe');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('textarea', 'This is a test message from the E2E test.');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message or response
    await expect(page.locator('.success-message, .emma-success')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Form submission works correctly');

    // Step 7: Verify assets load correctly
    console.log('Step 7: Verifying assets load...');
    
    // Check that JavaScript bundle loads
    const jsRequests = page.waitForResponse(response => 
      response.url().includes('.js') && response.status() === 200
    );
    
    // Check that CSS loads  
    const cssRequests = page.waitForResponse(response => 
      response.url().includes('.css') && response.status() === 200
    );
    
    // Reload page to trigger asset loading
    await page.reload();
    
    await jsRequests;
    await cssRequests;
    
    console.log('✅ All assets load correctly');

    // Step 8: Test API endpoint directly
    console.log('Step 8: Testing API endpoint...');
    
    const apiResponse = await page.request.post(`http://${TEST_HOST}:${TEST_PORT}/api/submit/${formId}`, {
      data: {
        data: {
          name: 'API Test User',
          email: 'api@example.com', 
          message: 'Direct API test'
        },
        meta: {
          timestamp: new Date().toISOString(),
          userAgent: 'playwright-test'
        }
      }
    });
    
    expect(apiResponse.status()).toBe(200);
    const apiData = await apiResponse.json();
    expect(apiData).toHaveProperty('success');
    
    console.log('✅ API endpoint works correctly');

    console.log('🎉 Complete Emma workflow test PASSED!');
  });

  test('form with different field types renders correctly', async ({ page }) => {
    // Create a more complex form with various field types
    console.log('Creating complex form with multiple field types...');
    
    const formName = `complex-form-${Date.now()}`;
    const createOutput = execSync(`node "${EMMA_CLI_PATH}" create ${formName}`, {
      cwd: tempDir,
      encoding: 'utf8',
      input: '\ndefault\nfirst_name\ntext\nFirst Name\ny\n\nlast_name\ntext\nLast Name\nn\n\nemail\nemail\nEmail\ny\n\nphone\ntel\nPhone\nn\n\nbirthdate\ndate\nBirth Date\nn\n\nwebsite\nurl\nWebsite\nn\n\ncomments\ntextarea\nComments\nn\n\nn\nSubmit\nThank you!\nError occurred.\n',
      timeout: 30000
    });

    const formIdMatch = createOutput.match(/Form ID: ([^\s\n]+)/);
    const formId = formIdMatch![1];

    // Build and deploy
    execSync(`node "${EMMA_CLI_PATH}" build ${formId}`, { cwd: tempDir });
    
    // Kill previous server if running
    if (serverProcess) {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Start new deployment
    serverProcess = spawn('node', [EMMA_CLI_PATH, 'deploy', formId, '--port', TEST_PORT.toString()], {
      cwd: tempDir,
      stdio: 'pipe'
    });

    // Wait for server
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      serverProcess!.stdout?.on('data', (data) => {
        if (data.toString().includes('Local deployment complete!')) {
          clearTimeout(timeout);
          resolve(void 0);
        }
      });
    });

    // Test the complex form
    const formUrl = `http://${TEST_HOST}:${TEST_PORT}/forms/${formId}`;
    await page.goto(formUrl);

    // Verify different input types are present
    await expect(page.locator('input[type="text"]')).toHaveCount(2); // first_name, last_name
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="url"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();

    console.log('✅ Complex form with multiple field types works correctly');
  });

  test('form history and snapshots work correctly', async () => {
    console.log('Testing form history and snapshots...');
    
    const formName = `history-test-${Date.now()}`;
    const createOutput = execSync(`node "${EMMA_CLI_PATH}" create ${formName}`, {
      cwd: tempDir,
      encoding: 'utf8',
      input: '\ndefault\nname\ntext\nName\ny\n\nn\nSubmit\nThank you!\nError.\n',
      timeout: 30000
    });

    const formIdMatch = createOutput.match(/Form ID: ([^\s\n]+)/);
    const formId = formIdMatch![1];

    // Check initial history
    const historyOutput = execSync(`node "${EMMA_CLI_PATH}" history ${formId}`, {
      cwd: tempDir,
      encoding: 'utf8'
    });

    expect(historyOutput).toContain('Snapshot History');
    expect(historyOutput).toContain('Initial version');
    
    console.log('✅ Form history works correctly');
  });
});