/**
 * Tests for provider management commands
 */

import { describe, it, expect } from 'vitest';
import { EmmaConfig } from '../config.js';
import path from 'path';

describe('Provider Management', () => {
  it('should discover installed providers', async () => {
    const { providersCommand } = await import('../commands/providers.js');
    const config = new EmmaConfig(
      path.join(process.cwd(), '.tmp-test-providers')
    );

    const cmd = providersCommand(config);
    expect(cmd).toBeDefined();
    expect(cmd.name()).toBe('providers');

    // Check subcommands exist
    const subcommands = cmd.commands;
    const subcommandNames = subcommands.map((c) => c.name());

    expect(subcommandNames).toContain('list');
    expect(subcommandNames).toContain('info');
    expect(subcommandNames).toContain('install');
  });

  it('should export ensureProviderAvailable helper', async () => {
    const { ensureProviderAvailable } = await import(
      '../commands/providers.js'
    );
    expect(ensureProviderAvailable).toBeDefined();
    expect(typeof ensureProviderAvailable).toBe('function');
  });
});
