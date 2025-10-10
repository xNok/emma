/**
 * Integration tests for local deployment and preview functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import http from 'http';
import { EmmaConfig } from '../config.js';
import { LocalDeployment } from '../local-deployment.js';

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  submissionId?: string;
}
import { FormBuilder } from '../form-builder.js';
import type { FormSchema } from '@emma/shared/types';

// Helper function to make HTTP requests
async function makeRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<{ status: number; headers: Record<string, string>; text: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers as Record<string, string>,
          text: data,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

describe('LocalDeployment Integration Tests', () => {
  let tempDir: string;
  let config: EmmaConfig;
  let deployment: LocalDeployment;
  let builder: FormBuilder;
  let testPort: number;

  const mockFormSchema: FormSchema = {
    formId: 'test-form-001',
    name: 'Test Form',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3333/api/submit/test-form-001',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Your Name',
        required: true,
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
      },
    ],
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you!',
      errorMessage: 'Please fix errors',
      honeypot: {
        enabled: true,
        fieldName: 'website',
      },
    },
  };

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(process.cwd(), '.test-tmp');
    await fs.ensureDir(tempDir);

    // Initialize config with temp directory
    config = new EmmaConfig(tempDir);
    await config.initialize();

    // Save test form schema
    await config.saveFormSchema(mockFormSchema.formId, mockFormSchema);

    // Create instances
    deployment = new LocalDeployment(config);
    builder = new FormBuilder(config);

    // Use random port to avoid conflicts
    testPort = 3000 + Math.floor(Math.random() * 1000);
  });

  afterEach(async () => {
    // Stop deployment if running
    if (deployment) {
      await deployment.stopServer();
    }

    // Clean up temp directory
    await fs.remove(tempDir);
  });

  describe('Asset Serving', () => {
    it('should build and serve form assets correctly', async () => {
      // Build the form
      const buildResult = await builder.build(
        mockFormSchema.formId,
        mockFormSchema
      );
      expect(buildResult).toBeDefined();
      expect(buildResult.bundlePath).toContain(`${mockFormSchema.formId}.js`);

      // Deploy locally
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      expect(deployResult.formUrl).toBe(
        `http://localhost:${testPort}/forms/${mockFormSchema.formId}`
      );
      expect(deployResult.apiUrl).toBe(
        `http://localhost:${testPort}/api/submit/${mockFormSchema.formId}`
      );

      // Test form HTML page
      const htmlResponse = await makeRequest(deployResult.formUrl);
      expect(htmlResponse.status).toBe(200);
      expect(htmlResponse.headers['content-type']).toContain('text/html');

      const htmlContent = htmlResponse.text;
      expect(htmlContent).toContain('Form Preview');
      expect(htmlContent).toContain(mockFormSchema.name);
      expect(htmlContent).toContain(`${mockFormSchema.formId}.js`);

      // Test JavaScript bundle
      const jsUrl = `${deployResult.formUrl}/${mockFormSchema.formId}.js`;
      const jsResponse = await makeRequest(jsUrl);
      expect(jsResponse.status).toBe(200);
      expect(jsResponse.headers['content-type']).toContain(
        'application/javascript'
      );

      const jsContent = jsResponse.text;
      // Updated to check for ESM pattern instead of IIFE
      expect(jsContent).toContain("import FormRenderer from './emma-forms.esm.js'");
      expect(jsContent).toContain(mockFormSchema.formId);

      // Test theme CSS
      const cssUrl = `${deployResult.formUrl}/themes/${mockFormSchema.theme}.css`;
      const cssResponse = await makeRequest(cssUrl);
      expect(cssResponse.status).toBe(200);
      expect(cssResponse.headers['content-type']).toContain('text/css');
    });

    it('should handle 404 for non-existent assets', async () => {
      // Deploy without building first
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Test non-existent asset
      const invalidAssetUrl = `${deployResult.formUrl}/non-existent.js`;
      const response = await makeRequest(invalidAssetUrl);
      expect(response.status).toBe(404);
    });

    it('should serve correct MIME types for different assets', async () => {
      // Build and deploy
      await builder.build(mockFormSchema.formId, mockFormSchema);
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Test JavaScript MIME type
      const jsResponse = await makeRequest(
        `${deployResult.formUrl}/${mockFormSchema.formId}.js`
      );
      expect(jsResponse.headers['content-type']).toContain(
        'application/javascript'
      );

      // Test CSS MIME type
      const cssResponse = await makeRequest(
        `${deployResult.formUrl}/themes/${mockFormSchema.theme}.css`
      );
      expect(cssResponse.headers['content-type']).toContain('text/css');

      // Test HTML MIME type
      const htmlResponse = await makeRequest(deployResult.formUrl);
      expect(htmlResponse.headers['content-type']).toContain('text/html');
    });
  });

  describe('API Endpoints', () => {
    it('should handle form submissions', async () => {
      // Build and deploy
      await builder.build(mockFormSchema.formId, mockFormSchema);
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Test form submission
      const submissionData = {
        formId: mockFormSchema.formId,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        meta: {
          timestamp: new Date().toISOString(),
          userAgent: 'test-agent',
          referrer: 'test-referrer',
        },
      };

      const response = await makeRequest(deployResult.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      expect(response.status).toBe(200);
      const result = JSON.parse(response.text) as ApiResponse;
      expect(result.success).toBe(true);
      expect(result.message).toContain('submitted successfully');
    });

    it('should detect honeypot spam', async () => {
      // Build and deploy
      await builder.build(mockFormSchema.formId, mockFormSchema);
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Test honeypot detection
      const spamData = {
        formId: mockFormSchema.formId,
        data: {
          name: 'Spam Bot',
          email: 'spam@example.com',
          website: 'http://spam.com', // This should trigger honeypot
        },
        meta: {
          timestamp: new Date().toISOString(),
          userAgent: 'spam-bot',
          referrer: '',
        },
      };

      const response = await makeRequest(deployResult.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spamData),
      });

      expect(response.status).toBe(400);
      const result = JSON.parse(response.text) as ApiResponse;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Spam detected');
    });
  });

  describe('Debug Links', () => {
    it('should include debug links in HTML output', async () => {
      // Build and deploy
      await builder.build(mockFormSchema.formId, mockFormSchema);
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Get HTML content
      const response = await makeRequest(deployResult.formUrl);
      const htmlContent = response.text;

      // Check for debug links (ESM bundle references)
      expect(htmlContent).toContain('Debug Assets');
      expect(htmlContent).toContain(`${mockFormSchema.formId}.js`);
      expect(htmlContent).toContain('themes/default.css');
      expect(htmlContent).toContain(mockFormSchema.apiEndpoint);

      // Verify debug links are clickable
      expect(htmlContent).toContain('href=');
      // Links are relative paths, not using target="_blank"
      expect(htmlContent).toContain(`${mockFormSchema.formId}.js`);
    });
  });

  describe('Route Ordering', () => {
    it('should prioritize asset routes over form ID routes', async () => {
      // Build and deploy
      await builder.build(mockFormSchema.formId, mockFormSchema);
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Test that /forms/formId/asset.js is treated as an asset, not a form ID
      const jsResponse = await makeRequest(
        `${deployResult.formUrl}/${mockFormSchema.formId}.js`
      );
      expect(jsResponse.status).toBe(200);
      expect(jsResponse.headers['content-type']).toContain(
        'application/javascript'
      );

      // Should not return "Form Not Found" HTML
      const jsContent = jsResponse.text;
      expect(jsContent).not.toContain('Form Not Found');
      // Updated to check for ESM pattern
      expect(jsContent).toContain("import FormRenderer from './emma-forms.esm.js'");
    });
  });

  describe('Server Management', () => {
    it('should start and stop server correctly', async () => {
      // Deploy (starts server)
      const deployResult = await deployment.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Server should be accessible
      const response = await makeRequest(deployResult.formUrl);
      expect(response.status).toBeDefined();

      // Stop server
      await deployment.stopServer();

      // Server should no longer be accessible
      try {
        await makeRequest(deployResult.formUrl);
        expect.fail('Server should not be accessible after stopping');
      } catch (error) {
        // Expected - connection refused
        expect(error).toBeDefined();
      }
    });

    it('should handle port conflicts gracefully', async () => {
      // Start first deployment
      const deployment1 = new LocalDeployment(config);
      await deployment1.deploy(mockFormSchema.formId, {
        host: 'localhost',
        port: testPort,
      });

      // Try to start second deployment on same port
      const deployment2 = new LocalDeployment(config);
      await expect(
        deployment2.deploy(mockFormSchema.formId, {
          host: 'localhost',
          port: testPort,
        })
      ).rejects.toThrow();

      // Clean up
      await deployment1.stopServer();
    });
  });
});
