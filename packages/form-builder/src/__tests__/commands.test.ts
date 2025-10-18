/**
 * Tests for edit and history commands
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    vi.clearAllMocks();
  });

  it('should create command with correct description', () => {
    const command = editCommand(config);
    expect(command.name()).toBe('edit');
    expect(command.description()).toContain('Edit a form interactively');
  });

  it('should require form-id argument', () => {
    const command = editCommand(config);
    expect(command.args).toHaveLength(1);
    expect(command.args[0].name()).toBe('form-id');
    expect(command.args[0].required).toBe(true);
  });

  it('should check if Emma is initialized', async () => {
    const uninitializedConfig = new EmmaConfig(
      path.join(testDir, 'uninitialized')
    );
    const command = editCommand(uninitializedConfig);

    // Mock console.log to capture output
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Execute command action with a non-existent form
    const action = command._actionHandler;
    if (action) {
      await action('test-form', {});
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Emma is not initialized')
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle non-existent form', async () => {
    const command = editCommand(config);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = command._actionHandler;
    if (action) {
      await action('non-existent-form', {});
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('not found')
    );

    consoleLogSpy.mockRestore();
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
    vi.clearAllMocks();
  });

  it('should create command with correct description', () => {
    const command = historyCommand(config);
    expect(command.name()).toBe('history');
    expect(command.description()).toContain('View snapshot history');
  });

  it('should require form-id argument', () => {
    const command = historyCommand(config);
    expect(command.args).toHaveLength(1);
    expect(command.args[0].name()).toBe('form-id');
    expect(command.args[0].required).toBe(true);
  });

  it('should check if Emma is initialized', async () => {
    const uninitializedConfig = new EmmaConfig(
      path.join(testDir, 'uninitialized')
    );
    const command = historyCommand(uninitializedConfig);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = command._actionHandler;
    if (action) {
      await action('test-form', {});
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Emma is not initialized')
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle non-existent form', async () => {
    const command = historyCommand(config);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = command._actionHandler;
    if (action) {
      await action('non-existent-form', {});
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('not found')
    );

    consoleLogSpy.mockRestore();
  });

  it('should display snapshot history for form with snapshots', async () => {
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

    const command = historyCommand(config);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = command._actionHandler;
    if (action) {
      await action('test-form', {});
    }

    // Verify output contains expected information
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Snapshot History')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test Form')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Initial version')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Added email field')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('CURRENT')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('DEPLOYED')
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle form without snapshots gracefully', async () => {
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
      // No snapshot fields
    };

    await config.saveFormSchema('legacy-form', schema);

    const command = historyCommand(config);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = command._actionHandler;
    if (action) {
      await action('legacy-form', {});
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No snapshot history')
    );

    consoleLogSpy.mockRestore();
  });

  it('should sort snapshots by timestamp (newest first)', async () => {
    const t1 = 1729089000;
    const t2 = 1729189000;
    const t3 = 1729289000;

    const schema: FormSchema = {
      formId: 'test-form',
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'http://localhost:3333/api/submit/test-form',
      fields: [],
      currentSnapshot: t3,
      snapshots: [
        {
          timestamp: t1,
          r2Key: `test-form-${t1}.js`,
          changes: 'First',
        },
        {
          timestamp: t3,
          r2Key: `test-form-${t3}.js`,
          changes: 'Third',
        },
        {
          timestamp: t2,
          r2Key: `test-form-${t2}.js`,
          changes: 'Second',
        },
      ],
    };

    await config.saveFormSchema('test-form', schema);

    const command = historyCommand(config);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const action = command._actionHandler;
    if (action) {
      await action('test-form', {});
    }

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const thirdIndex = calls.findIndex((call) => call.includes('Third'));
    const secondIndex = calls.findIndex((call) => call.includes('Second'));
    const firstIndex = calls.findIndex((call) => call.includes('First'));

    // Verify order: Third (newest) should appear before Second, which appears before First
    expect(thirdIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(firstIndex);

    consoleLogSpy.mockRestore();
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
