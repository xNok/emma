/**
 * Config Tests - Test configuration management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { EmmaConfig } from '../config.js';
import type { FormSchema } from '@xnok/emma-shared/types';

describe('EmmaConfig', () => {
  let testDir: string;
  let config: EmmaConfig;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = path.join(
      os.tmpdir(),
      `emma-test-${Math.random().toString(36).substring(2)}`
    );
    await fs.ensureDir(testDir);

    config = new EmmaConfig(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('constructor', () => {
    it('should create config with default values', () => {
      expect(config.get('initialized')).toBe(false);
      expect(config.get('defaultTheme')).toBe('default');
      expect(config.get('localServerPort')).toBe(3333);
      expect(config.get('localServerHost')).toBe('localhost');
    });

    it('should set correct directory paths', () => {
      const expectedFormsDir = path.join(testDir, 'forms');
      const expectedBuildsDir = path.join(testDir, 'builds');

      expect(config.getFormsDir()).toBe(expectedFormsDir);
      expect(config.getBuildsDir()).toBe(expectedBuildsDir);
    });
  });

  describe('load and save', () => {
    it('should load default config when file does not exist', async () => {
      await config.load();
      expect(config.get('initialized')).toBe(false);
    });

    it('should save and load configuration', async () => {
      config.set('defaultTheme', 'minimal');
      config.set('localServerPort', 4000);
      await config.save();

      const newConfig = new EmmaConfig(testDir);
      await newConfig.load();

      expect(newConfig.get('defaultTheme')).toBe('minimal');
      expect(newConfig.get('localServerPort')).toBe(4000);
    });

    it('should handle corrupted config file gracefully', async () => {
      // Create corrupted config file
      const configFile = path.join(testDir, '.emma', 'config.json');
      await fs.ensureDir(path.dirname(configFile));
      await fs.writeFile(configFile, 'invalid json', 'utf8');

      // Should not throw and use defaults
      await expect(config.load()).resolves.not.toThrow();
      expect(config.get('initialized')).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should create directories and mark as initialized', async () => {
      await config.initialize();

      expect(config.isInitialized()).toBe(true);
      expect(await fs.pathExists(config.getFormsDir())).toBe(true);
      expect(await fs.pathExists(config.getBuildsDir())).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'config.json'))).toBe(true);
    });
  });

  describe('form schema management', () => {
    const mockSchema: FormSchema = {
      formId: 'test-form-001',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'http://localhost:3333/api/submit/test-form-001',
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
      await config.initialize();
    });

    it('should save and load form schema', async () => {
      await config.saveFormSchema('test-form-001', mockSchema);

      const loaded = await config.loadFormSchema('test-form-001');
      expect(loaded).toEqual(mockSchema);
    });

    it('should return null for non-existent form', async () => {
      const loaded = await config.loadFormSchema('non-existent');
      expect(loaded).toBeNull();
    });

    it('should list form schemas', async () => {
      await config.saveFormSchema('form1', mockSchema);
      await config.saveFormSchema('form2', { ...mockSchema, formId: 'form2' });

      const forms = await config.listFormSchemas();
      expect(forms).toHaveLength(2);
      expect(forms).toContain('form1');
      expect(forms).toContain('form2');
    });

    it('should delete form schema and builds', async () => {
      await config.saveFormSchema('test-form-001', mockSchema);

      // Create mock build directory
      const buildDir = config.getBuildPath('test-form-001');
      await fs.ensureDir(buildDir);
      await fs.writeFile(path.join(buildDir, 'form.js'), 'mock bundle', 'utf8');

      await config.deleteFormSchema('test-form-001');

      expect(await config.loadFormSchema('test-form-001')).toBeNull();
      expect(await fs.pathExists(buildDir)).toBe(false);
    });

    it('should handle YAML parsing errors', async () => {
      const formPath = config.getFormPath('invalid-form');
      await fs.ensureDir(path.dirname(formPath));
      await fs.writeFile(formPath, 'invalid: yaml: content:', 'utf8');

      await expect(config.loadFormSchema('invalid-form')).rejects.toThrow();
    });
  });

  describe('path methods', () => {
    it('should return correct form path', () => {
      const formPath = config.getFormPath('test-form');
      expect(formPath).toMatch(/forms\/test-form\.yaml$/);
    });

    it('should return correct build path', () => {
      const buildPath = config.getBuildPath('test-form');
      expect(buildPath).toMatch(/builds\/test-form$/);
    });
  });
});
