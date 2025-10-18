/**
 * Tests for edit and history commands
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmmaConfig } from '../config';
import { editCommand } from '../commands/edit';
import { historyCommand } from '../commands/history';
import type { FormSchema } from '@xnok/emma-shared/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Edit Command', () => {
  let config: EmmaConfig;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `emma-edit-test-${Date.now()}`);
    config = new EmmaConfig(testDir);
    await config.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create command with correct name and description', () => {
    const command = editCommand(config);
    expect(command.name()).toBe('edit');
    expect(command.description()).toContain('Edit a form interactively');
  });
});

describe('History Command', () => {
  let config: EmmaConfig;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `emma-history-test-${Date.now()}`);
    config = new EmmaConfig(testDir);
    await config.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create command with correct name and description', () => {
    const command = historyCommand(config);
    expect(command.name()).toBe('history');
    expect(command.description()).toContain('View snapshot history');
  });
});

describe('Snapshot Workflow', () => {
  let config: EmmaConfig;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `emma-snapshot-test-${Date.now()}`);
    config = new EmmaConfig(testDir);
    await config.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should load form with snapshot history', async () => {
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
        },
      ],
      createdAt: now - 3600,
      lastModified: now,
      currentSnapshot: now,
      snapshots: [
        {
          timestamp: now - 3600,
          r2Key: `test-form-${now - 3600}.js`,
          changes: 'Initial version',
          deployed: false,
        },
        {
          timestamp: now,
          r2Key: `test-form-${now}.js`,
          changes: 'Added email field',
          deployed: true,
        },
      ],
    };

    await config.saveFormSchema('test-form', schema);
    const loaded = await config.loadFormSchema('test-form');

    expect(loaded).toBeDefined();
    expect(loaded?.snapshots).toHaveLength(2);
    expect(loaded?.currentSnapshot).toBe(now);
    expect(loaded?.snapshots?.[0].changes).toBe('Initial version');
    expect(loaded?.snapshots?.[1].changes).toBe('Added email field');
    expect(loaded?.snapshots?.[1].deployed).toBe(true);
  });

  it('should handle form without snapshots', async () => {
    const schema: FormSchema = {
      formId: 'legacy-form',
      name: 'Legacy Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'http://localhost:3333/api/submit/legacy-form',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    await config.saveFormSchema('legacy-form', schema);
    const loaded = await config.loadFormSchema('legacy-form');

    expect(loaded).toBeDefined();
    expect(loaded?.snapshots).toBeUndefined();
  });
});

describe('Constants', () => {
  it('should export FIELD_TYPES constant', async () => {
    const { FIELD_TYPES } = await import('../constants.js');
    expect(FIELD_TYPES).toBeDefined();
    expect(Array.isArray(FIELD_TYPES)).toBe(true);
    expect(FIELD_TYPES.length).toBeGreaterThan(0);
  });

  it('should have all expected field types', async () => {
    const { FIELD_TYPES } = await import('../constants.js');
    const types = FIELD_TYPES.map((ft) => ft.value);

    expect(types).toContain('text');
    expect(types).toContain('email');
    expect(types).toContain('textarea');
    expect(types).toContain('number');
    expect(types).toContain('tel');
    expect(types).toContain('url');
    expect(types).toContain('select');
    expect(types).toContain('radio');
    expect(types).toContain('checkbox');
    expect(types).toContain('date');
    expect(types).toContain('time');
    expect(types).toContain('datetime-local');
    expect(types).toContain('hidden');
  });

  it('should have descriptions for all field types', async () => {
    const { FIELD_TYPES } = await import('../constants.js');

    FIELD_TYPES.forEach((fieldType) => {
      expect(fieldType.name).toBeDefined();
      expect(fieldType.value).toBeDefined();
      expect(fieldType.description).toBeDefined();
      expect(fieldType.description.length).toBeGreaterThan(0);
    });
  });

  it('should export THEMES constant', async () => {
    const { THEMES } = await import('../constants.js');
    expect(THEMES).toBeDefined();
    expect(Array.isArray(THEMES)).toBe(true);
    expect(THEMES.length).toBeGreaterThan(0);
  });
});
