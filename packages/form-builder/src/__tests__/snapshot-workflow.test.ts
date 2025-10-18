/**
 * Integration tests for snapshot-based form versioning workflow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmmaConfig } from '../config';
import { FormBuilder } from '../form-builder';
import type { FormSchema } from '@xnok/emma-shared/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Snapshot Workflow Integration', () => {
  let config: EmmaConfig;
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testDir = path.join(os.tmpdir(), `emma-snapshot-test-${Date.now()}`);
    config = new EmmaConfig(testDir);
    await config.initialize();
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('Form Creation with Snapshots', () => {
    it('should create a form with initial snapshot', async () => {
      const now = Math.floor(Date.now() / 1000);
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
            addedAt: now,
          },
        ],
        createdAt: now,
        lastModified: now,
        currentSnapshot: now,
        snapshots: [
          {
            timestamp: now,
            r2Key: `test-form-${now}.js`,
            changes: 'Initial version',
            deployed: false,
          },
        ],
      };

      await config.saveFormSchema('test-form', schema);

      const loaded = await config.loadFormSchema('test-form');
      expect(loaded).toBeDefined();
      expect(loaded?.currentSnapshot).toBe(now);
      expect(loaded?.snapshots).toHaveLength(1);
      expect(loaded?.snapshots?.[0].changes).toBe('Initial version');
      expect(loaded?.fields[0].addedAt).toBe(now);
    });
  });

  describe('Form Editing and Snapshot Creation', () => {
    it('should create new snapshot when form is edited', async () => {
      const initialTime = Math.floor(Date.now() / 1000);
      const editTime = initialTime + 3600; // 1 hour later

      // Create initial form
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
            addedAt: initialTime,
          },
        ],
        createdAt: initialTime,
        lastModified: initialTime,
        currentSnapshot: initialTime,
        snapshots: [
          {
            timestamp: initialTime,
            r2Key: `test-form-${initialTime}.js`,
            changes: 'Initial version',
            deployed: false,
          },
        ],
      };

      await config.saveFormSchema('test-form', schema);

      // Edit form: add a new field and create new snapshot
      schema.fields.push({
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        addedAt: editTime,
      });

      schema.lastModified = editTime;
      schema.currentSnapshot = editTime;
      schema.snapshots?.push({
        timestamp: editTime,
        r2Key: `test-form-${editTime}.js`,
        changes: 'Added email field',
        deployed: false,
      });

      await config.saveFormSchema('test-form', schema);

      const loaded = await config.loadFormSchema('test-form');
      expect(loaded?.snapshots).toHaveLength(2);
      expect(loaded?.currentSnapshot).toBe(editTime);
      expect(loaded?.fields).toHaveLength(2);
      expect(loaded?.fields[1].addedAt).toBe(editTime);
    });
  });

  describe('Building Specific Snapshots', () => {
    it('should build bundle with timestamp-based filename', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
        currentSnapshot: timestamp,
        snapshots: [
          {
            timestamp,
            r2Key: `test-form-${timestamp}.js`,
            changes: 'Initial version',
          },
        ],
      };

      const builder = new FormBuilder(config);
      const result = await builder.build('test-form', schema);

      expect(result.bundlePath).toContain(`test-form-${timestamp}.js`);
      expect(await fs.pathExists(result.bundlePath)).toBe(true);
    });

    it('should build specific historical snapshot', async () => {
      const oldTimestamp = 1729089000;
      const newTimestamp = 1729189000;

      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true },
        ],
        currentSnapshot: newTimestamp,
        snapshots: [
          {
            timestamp: oldTimestamp,
            r2Key: `test-form-${oldTimestamp}.js`,
            changes: 'Initial version',
          },
          {
            timestamp: newTimestamp,
            r2Key: `test-form-${newTimestamp}.js`,
            changes: 'Added email field',
          },
        ],
      };

      const builder = new FormBuilder(config);

      // Build old snapshot
      const oldResult = await builder.build('test-form', schema, oldTimestamp);
      expect(oldResult.bundlePath).toContain(`test-form-${oldTimestamp}.js`);
      expect(await fs.pathExists(oldResult.bundlePath)).toBe(true);

      // Build current snapshot
      const newResult = await builder.build('test-form', schema, newTimestamp);
      expect(newResult.bundlePath).toContain(`test-form-${newTimestamp}.js`);
      expect(await fs.pathExists(newResult.bundlePath)).toBe(true);

      // Both bundles should exist
      expect(await fs.pathExists(oldResult.bundlePath)).toBe(true);
      expect(await fs.pathExists(newResult.bundlePath)).toBe(true);
    });
  });

  describe('Snapshot Metadata', () => {
    it('should track when fields are added', async () => {
      const t1 = 1729089000;
      const t2 = 1729189000;

      const schema: FormSchema = {
        formId: 'test-form',
        name: 'Test Form',
        version: '1.0.0',
        theme: 'default',
        apiEndpoint: 'http://localhost:3333/api/submit/test-form',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
            addedAt: t1,
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email',
            required: true,
            addedAt: t2,
          },
        ],
        currentSnapshot: t2,
        snapshots: [
          { timestamp: t1, r2Key: `test-form-${t1}.js`, changes: 'Initial' },
          {
            timestamp: t2,
            r2Key: `test-form-${t2}.js`,
            changes: 'Added email',
          },
        ],
      };

      await config.saveFormSchema('test-form', schema);
      const loaded = await config.loadFormSchema('test-form');

      expect(loaded?.fields[0].addedAt).toBe(t1);
      expect(loaded?.fields[1].addedAt).toBe(t2);
    });
  });
});
