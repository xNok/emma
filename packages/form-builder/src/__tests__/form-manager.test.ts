/**
 * Form Manager Tests - Test high-level form operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { EmmaConfig } from '../config.js';
import { FormManager } from '../form-manager.js';
import type { FormSchema } from '@emma/shared/types';

describe('FormManager', () => {
  let testDir: string;
  let config: EmmaConfig;
  let manager: FormManager;

  const mockSchema: FormSchema = {
    formId: 'manager-test-001',
    name: 'Manager Test Form',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3333/api/submit/manager-test-001',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      },
    ],
  };

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = path.join(os.tmpdir(), `emma-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Mock homedir to use test directory
    const originalHomedir = os.homedir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (os as any).homedir = () => testDir;

    config = new EmmaConfig();
    await config.initialize();
    manager = new FormManager(config);

    // Restore after each test
    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (os as any).homedir = originalHomedir;
    });
  });

  afterEach(async () => {
    // Stop any running deployment server
    if (manager.isDeploymentRunning()) {
      // Access private deployment instance to stop server
      const deployment = (manager as any).deployment;
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
    }

    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('form management', () => {
    it('should create form', async () => {
      await manager.createForm('manager-test-001', mockSchema);

      const retrieved = await manager.getForm('manager-test-001');
      expect(retrieved).toEqual(mockSchema);
    });

    it('should get form', async () => {
      await config.saveFormSchema('manager-test-001', mockSchema);

      const retrieved = await manager.getForm('manager-test-001');
      expect(retrieved).toEqual(mockSchema);
    });

    it('should return null for non-existent form', async () => {
      const retrieved = await manager.getForm('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should list forms', async () => {
      await manager.createForm('form1', { ...mockSchema, formId: 'form1' });
      await manager.createForm('form2', { ...mockSchema, formId: 'form2' });

      const forms = await manager.listForms();
      expect(forms).toHaveLength(2);
      expect(forms).toContain('form1');
      expect(forms).toContain('form2');
    });

    it('should delete form', async () => {
      await manager.createForm('manager-test-001', mockSchema);

      // Verify form exists
      expect(await manager.getForm('manager-test-001')).toBeDefined();

      await manager.deleteForm('manager-test-001');

      // Verify form is deleted
      expect(await manager.getForm('manager-test-001')).toBeNull();
    });
  });

  describe('form building', () => {
    beforeEach(async () => {
      await manager.createForm('manager-test-001', mockSchema);
    });

    it('should build form', async () => {
      await manager.buildForm('manager-test-001');

      // Check that build artifacts exist
      const buildPath = config.getBuildPath('manager-test-001');
      const bundlePath = path.join(buildPath, 'manager-test-001.js');
      const htmlPath = path.join(buildPath, 'index.html');

      expect(await fs.pathExists(bundlePath)).toBe(true);
      expect(await fs.pathExists(htmlPath)).toBe(true);
    });

    it('should throw error for non-existent form', async () => {
      await expect(manager.buildForm('non-existent')).rejects.toThrow(
        'Form not found: non-existent'
      );
    });
  });

  describe('form deployment', () => {
    beforeEach(async () => {
      await manager.createForm('manager-test-001', mockSchema);
    });

    it('should deploy form', async () => {
      const options = { host: 'localhost', port: 3341 };
      const result = await manager.deployForm('manager-test-001', options);

      expect(result.formUrl).toBe(
        'http://localhost:3341/forms/manager-test-001'
      );
      expect(result.apiUrl).toBe(
        'http://localhost:3341/api/submit/manager-test-001'
      );
      expect(result.serverUrl).toBe('http://localhost:3341');
      expect(manager.isDeploymentRunning()).toBe(true);
    }, 10000);

    it('should report deployment status', () => {
      expect(manager.isDeploymentRunning()).toBe(false);
    });
  });

  describe('integration workflow', () => {
    it('should support complete form lifecycle', async () => {
      const formId = 'lifecycle-test-001';
      const schema = { ...mockSchema, formId };

      // Create
      await manager.createForm(formId, schema);
      expect(await manager.getForm(formId)).toEqual(schema);

      // Build
      await manager.buildForm(formId);
      const buildPath = config.getBuildPath(formId);
      expect(await fs.pathExists(path.join(buildPath, `${formId}.js`))).toBe(
        true
      );

      // Deploy
      const deployResult = await manager.deployForm(formId, {
        host: 'localhost',
        port: 3342,
      });
      expect(deployResult.formUrl).toContain(formId);
      expect(manager.isDeploymentRunning()).toBe(true);

      // List (should include our form)
      const forms = await manager.listForms();
      expect(forms).toContain(formId);

      // Delete
      await manager.deleteForm(formId);
      expect(await manager.getForm(formId)).toBeNull();
      expect(await fs.pathExists(buildPath)).toBe(false);
    }, 15000);
  });
});
