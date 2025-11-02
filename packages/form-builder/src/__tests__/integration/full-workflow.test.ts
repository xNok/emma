/**
 * Full Emma Workflow Integration Test
 * 
 * This test verifies the complete end-to-end workflow that users experience:
 * 1. Initialize Emma
 * 2. Create a form
 * 3. Build the form
 * 4. Deploy locally
 * 5. Access the form via HTTP
 * 6. Verify all assets load correctly
 * 
 * This test must always pass - it represents the core Emma user experience.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { EmmaConfig } from '../../config.js';
import { FormManager } from '../../form-manager.js';
import type { FormSchema } from '@xnok/emma-shared/types';

describe('Emma Full Workflow Integration', () => {
  let tempDir: string;
  let config: EmmaConfig;
  let manager: FormManager;
  let testFormId: string;
  const serverPort = 3334; // Use different port to avoid conflicts

  beforeAll(async () => {
    // Create temporary directory for test
    tempDir = await fs.mkdtemp(path.join(process.cwd(), 'test-emma-'));
    
    // Initialize Emma config in temp directory
    config = new EmmaConfig(tempDir);
    await config.init({
      defaultTheme: 'default',
      localServerHost: 'localhost',
      localServerPort: serverPort,
      provider: 'local'
    });
    
    manager = new FormManager(config);
  });

  afterAll(async () => {
    // Stop any running server
    if (manager.isDeploymentRunning()) {
      // Note: We need a stop method in the deployment
      console.log('Warning: Server still running after test');
    }
    
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  beforeEach(() => {
    // Generate unique form ID for each test
    testFormId = `test-form-${Date.now()}`;
  });

  it('should complete the full Emma workflow successfully', async () => {
    // Step 1: Create a form schema
    const schema: FormSchema = {
      formId: testFormId,
      name: 'Test Contact Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: `http://localhost:${serverPort}/api/submit/${testFormId}`,
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Your Name',
          required: true,
          addedAt: Date.now()
        },
        {
          id: 'email', 
          type: 'email',
          label: 'Email Address',
          required: true,
          addedAt: Date.now()
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          required: true,
          addedAt: Date.now()
        }
      ],
      settings: {
        submitButtonText: 'Send Message',
        successMessage: 'Thank you for your message!',
        errorMessage: 'Something went wrong. Please try again.',
        honeypot: {
          enabled: true,
          fieldName: 'website'
        }
      },
      createdAt: Date.now(),
      lastModified: Date.now(),
      currentSnapshot: Date.now(),
      snapshots: [
        {
          timestamp: Date.now(),
          r2Key: `${testFormId}-${Date.now()}.js`,
          changes: 'Initial version',
          deployed: false
        }
      ]
    };

    // Step 2: Save the form (equivalent to "emma create")
    await manager.createForm(testFormId, schema);
    
    // Verify form was created
    const savedSchema = await manager.getForm(testFormId);
    expect(savedSchema).toBeDefined();
    expect(savedSchema?.formId).toBe(testFormId);
    expect(savedSchema?.fields).toHaveLength(3);

    // Step 3: Build the form (equivalent to "emma build")
    await manager.buildForm(testFormId);
    
    // Verify build artifacts exist
    const buildPath = config.getBuildPath(testFormId);
    expect(await fs.pathExists(buildPath)).toBe(true);
    
    // Check for timestamped bundle
    const timestamp = savedSchema!.currentSnapshot;
    const bundleName = `${testFormId}-${timestamp}.js`;
    const bundlePath = path.join(buildPath, bundleName);
    expect(await fs.pathExists(bundlePath)).toBe(true);
    
    // Check for HTML files
    const indexPath = path.join(buildPath, 'index.html');
    expect(await fs.pathExists(indexPath)).toBe(true);
    
    // Verify HTML references correct timestamped bundle
    const htmlContent = await fs.readFile(indexPath, 'utf8');
    expect(htmlContent).toContain(`src="${bundleName}"`);
    expect(htmlContent).toContain(`data-emma-form="${testFormId}"`);

    // Step 4: Deploy locally (equivalent to "emma deploy")
    await manager.deployForm(testFormId, { 
      host: 'localhost', 
      port: serverPort 
    });
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify server is running
    expect(manager.isDeploymentRunning()).toBe(true);

    // Step 5: Test HTTP access
    const baseUrl = `http://localhost:${serverPort}`;
    
    // Test form page loads
    const formResponse = await axios.get(`${baseUrl}/forms/${testFormId}`);
    expect(formResponse.status).toBe(200);
    expect(formResponse.data).toContain('<title>Test Contact Form</title>');
    expect(formResponse.data).toContain(`src="${bundleName}"`);
    
    // Test bundle loads
    const bundleResponse = await axios.get(`${baseUrl}/forms/${testFormId}/${bundleName}`);
    expect(bundleResponse.status).toBe(200);
    expect(bundleResponse.headers['content-type']).toContain('javascript');
    expect(bundleResponse.data).toContain('EmmaForm');
    
    // Test CSS theme loads
    const themeResponse = await axios.get(`${baseUrl}/forms/${testFormId}/themes/default.css`);
    expect(themeResponse.status).toBe(200);
    expect(themeResponse.headers['content-type']).toContain('css');
    
    // Test API endpoint responds
    const apiResponse = await axios.post(`${baseUrl}/api/submit/${testFormId}`, {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      },
      meta: {
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      }
    });
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.data).toHaveProperty('success');

    // Step 6: Test form history and snapshots
    const history = await config.loadFormSchema(testFormId);
    expect(history?.snapshots).toHaveLength(1);
    expect(history?.currentSnapshot).toBeDefined();
    
    console.log(`✅ Full workflow test passed for form: ${testFormId}`);
  }, 30000); // 30 second timeout for full workflow

  it('should handle form updates and new snapshots correctly', async () => {
    // Create initial form
    const initialSchema: FormSchema = {
      formId: testFormId,
      name: 'Evolving Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: `http://localhost:${serverPort}/api/submit/${testFormId}`,
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          addedAt: Date.now()
        }
      ],
      settings: {
        submitButtonText: 'Submit',
        successMessage: 'Thank you!',
        errorMessage: 'Error occurred.',
        honeypot: { enabled: true, fieldName: 'website' }
      },
      createdAt: Date.now(),
      lastModified: Date.now(),
      currentSnapshot: Date.now(),
      snapshots: []
    };

    await manager.createForm(testFormId, initialSchema);
    await manager.buildForm(testFormId);

    // Update form with new field (simulating "emma edit")
    const updatedSchema = { ...initialSchema };
    const newTimestamp = Date.now() + 1000;
    updatedSchema.fields.push({
      id: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      addedAt: newTimestamp
    });
    updatedSchema.currentSnapshot = newTimestamp;
    updatedSchema.lastModified = newTimestamp;
    updatedSchema.snapshots.push({
      timestamp: newTimestamp,
      r2Key: `${testFormId}-${newTimestamp}.js`,
      changes: 'Added email field',
      deployed: false
    });

    await manager.createForm(testFormId, updatedSchema);
    await manager.buildForm(testFormId);

    // Verify new snapshot files exist
    const buildPath = config.getBuildPath(testFormId);
    const newBundlePath = path.join(buildPath, `${testFormId}-${newTimestamp}.js`);
    expect(await fs.pathExists(newBundlePath)).toBe(true);

    // Verify HTML references new bundle
    const htmlContent = await fs.readFile(path.join(buildPath, 'index.html'), 'utf8');
    expect(htmlContent).toContain(`${testFormId}-${newTimestamp}.js`);

    console.log(`✅ Form update and snapshot test passed for: ${testFormId}`);
  });

  it('should handle edge cases and error conditions gracefully', async () => {
    const nonExistentFormId = 'non-existent-form';

    // Test building non-existent form
    await expect(manager.buildForm(nonExistentFormId))
      .rejects.toThrow(`Form not found: ${nonExistentFormId}`);

    // Test getting non-existent form
    const result = await manager.getForm(nonExistentFormId);
    expect(result).toBeNull();

    console.log(`✅ Error handling test passed`);
  });
});