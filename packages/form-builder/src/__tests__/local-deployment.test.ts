/**
 * Local Deployment Tests - Test local server functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { EmmaConfig } from '../config.js';
import { LocalDeployment } from '../local-deployment.js';
import { FormBuilder } from '../form-builder.js';
import type { FormSchema } from '@emma/shared/types';

// Increase timeout for server operations
const TIMEOUT = 10000;

describe('LocalDeployment', () => {
  let testDir: string;
  let config: EmmaConfig;
  let deployment: LocalDeployment;
  let builder: FormBuilder;

  const mockSchema: FormSchema = {
    formId: 'test-form-001',
    name: 'Test Form',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3334/api/submit/test-form-001',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      },
    ],
    settings: {
      honeypot: {
        enabled: true,
        fieldName: 'website',
      },
    },
  };

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = path.join(os.tmpdir(), `emma-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    config = new EmmaConfig(testDir);
    await config.initialize();

    deployment = new LocalDeployment(config);
    builder = new FormBuilder(config);

    // Save test form
    await config.saveFormSchema('test-form-001', mockSchema);
  });

  afterEach(async () => {
    // Stop any running server
    if (deployment.isRunning()) {
      await new Promise<void>((resolve) => {
        const server = (deployment as any).server;
        if (server) {
          server.close(() => resolve());
        } else {
          resolve();
        }
      });
    }

    // Clean up test directory
    await fs.remove(testDir);
  });

  describe(
    'deploy',
    () => {
      it(
        'should deploy form and start server',
        async () => {
          const options = { host: 'localhost', port: 3334 };
          const result = await deployment.deploy('test-form-001', options);

          expect(result.formUrl).toBe(
            'http://localhost:3334/forms/test-form-001'
          );
          expect(result.apiUrl).toBe(
            'http://localhost:3334/api/submit/test-form-001'
          );
          expect(result.serverUrl).toBe('http://localhost:3334');
          expect(deployment.isRunning()).toBe(true);
          expect(deployment.getCurrentPort()).toBe(3334);
        },
        TIMEOUT
      );

      it(
        'should build form if bundle does not exist',
        async () => {
          const options = { host: 'localhost', port: 3335 };

          // Ensure no existing build
          const buildPath = config.getBuildPath('test-form-001');
          await fs.remove(buildPath);

          const result = await deployment.deploy('test-form-001', options);

          // Should have created the bundle
          const bundlePath = path.join(buildPath, 'test-form-001.js');
          expect(await fs.pathExists(bundlePath)).toBe(true);
          expect(result.formUrl).toBe(
            'http://localhost:3335/forms/test-form-001'
          );
        },
        TIMEOUT
      );

      it(
        'should handle form not found',
        async () => {
          const options = { host: 'localhost', port: 3336 };

          await expect(
            deployment.deploy('non-existent-form', options)
          ).rejects.toThrow('Form schema not found: non-existent-form');
        },
        TIMEOUT
      );

      it(
        'should reuse server if same port',
        async () => {
          const options = { host: 'localhost', port: 3337 };

          await deployment.deploy('test-form-001', options);
          const firstPort = deployment.getCurrentPort();

          await deployment.deploy('test-form-001', options);
          const secondPort = deployment.getCurrentPort();

          expect(firstPort).toBe(secondPort);
          expect(deployment.isRunning()).toBe(true);
        },
        TIMEOUT
      );
    },
    TIMEOUT
  );

  describe('ensureDeployed', () => {
    it(
      'should deploy if not already deployed',
      async () => {
        const options = { host: 'localhost', port: 3338 };
        const result = await deployment.ensureDeployed(
          'test-form-001',
          options
        );

        expect(result.formUrl).toContain('3338');
        expect(deployment.isRunning()).toBe(true);
      },
      TIMEOUT
    );
  });

  describe('server functionality', () => {
    let serverOptions: { host: string; port: number };

    beforeEach(async () => {
      serverOptions = { host: 'localhost', port: 3339 };
      await builder.build('test-form-001', mockSchema);
      await deployment.deploy('test-form-001', serverOptions);
    }, TIMEOUT);

    it(
      'should serve form preview pages',
      async () => {
        const response = await fetch(
          `http://localhost:3339/forms/test-form-001`
        );
        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toContain('text/html');

        const html = await response.text();
        expect(html).toContain('Test Form');
        expect(html).toContain('test-form-001');
      },
      TIMEOUT
    );

    it(
      'should serve form JavaScript bundles',
      async () => {
        const response = await fetch(
          `http://localhost:3339/forms/test-form-001/test-form-001.js`
        );
        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toContain(
          'application/javascript'
        );

        const js = await response.text();
        expect(js).toContain('window.EmmaForms.FormRenderer');
        expect(js).toContain('test-form-001');
      },
      TIMEOUT
    );

    it(
      'should handle form submission API',
      async () => {
        const submissionData = {
          formId: 'test-form-001',
          data: { name: 'Test User' },
          meta: { timestamp: new Date().toISOString() },
        };

        const response = await fetch(
          `http://localhost:3339/api/submit/test-form-001`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
          }
        );

        expect(response.ok).toBe(true);
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.submissionId).toBeDefined();
      },
      TIMEOUT
    );

    it(
      'should detect honeypot spam',
      async () => {
        const spamData = {
          formId: 'test-form-001',
          data: {
            name: 'Test User',
            website: 'spam-value', // This should trigger honeypot
          },
          meta: { timestamp: new Date().toISOString() },
        };

        const response = await fetch(
          `http://localhost:3339/api/submit/test-form-001`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spamData),
          }
        );

        expect(response.status).toBe(400);
        const result = await response.json();
        expect(result.success).toBe(false);
        expect(result.error).toBe('Spam detected');
      },
      TIMEOUT
    );

    it(
      'should serve server info',
      async () => {
        const response = await fetch(`http://localhost:3339/api/info`);
        expect(response.ok).toBe(true);

        const info = await response.json();
        expect(info.service).toBe('Emma Forms Local Server');
        expect(info.version).toBe('0.1.0');
        expect(info.timestamp).toBeDefined();
      },
      TIMEOUT
    );

    it(
      'should serve root page with form listing',
      async () => {
        const response = await fetch(`http://localhost:3339/`);
        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toContain('text/html');

        const html = await response.text();
        expect(html).toContain('Emma Forms - Local Development Server');
        expect(html).toContain('test-form-001');
      },
      TIMEOUT
    );

    it(
      'should handle 404 for non-existent forms',
      async () => {
        const response = await fetch(
          `http://localhost:3339/forms/non-existent`
        );
        expect(response.status).toBe(404);

        const html = await response.text();
        expect(html).toContain('Form Not Found');
        expect(html).toContain('non-existent');
      },
      TIMEOUT
    );

    it(
      'should handle 404 for non-existent bundles',
      async () => {
        const response = await fetch(
          `http://localhost:3339/forms/non-existent/non-existent.js`
        );
        expect(response.status).toBe(404);

        const text = await response.text();
        expect(text).toContain('Asset not found');
      },
      TIMEOUT
    );
  });

  describe('server management', () => {
    it('should report not running initially', () => {
      expect(deployment.isRunning()).toBe(false);
      expect(deployment.getCurrentPort()).toBeNull();
    });

    it(
      'should report running after deployment',
      async () => {
        const options = { host: 'localhost', port: 3340 };
        await deployment.deploy('test-form-001', options);

        expect(deployment.isRunning()).toBe(true);
        expect(deployment.getCurrentPort()).toBe(3340);
      },
      TIMEOUT
    );
  });
});
