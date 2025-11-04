/**
 * Tests for provider management commands and provider loading system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmmaConfig } from '../config.js';
import path from 'path';

// Mock the provider module
vi.mock('@xnok/emma-provider-cloudflare', () => ({
  createCloudflareProvider: vi.fn(() => ({
    name: 'cloudflare',
    description: 'Deploy to Cloudflare R2',
    register: vi.fn(),
    execute: vi.fn(),
  })),
}));

describe('Provider Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('Provider Loading System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load provider by identifier', async () => {
    const { loadProviderByIdentifier } = await import('../deployment/index.js');

    const provider = await loadProviderByIdentifier(
      '@xnok/emma-provider-cloudflare'
    );

    expect(provider).toBeDefined();
    expect(provider?.name).toBe('cloudflare');
    expect(provider?.description).toBe('Deploy to Cloudflare R2');
    expect(typeof provider?.register).toBe('function');
    expect(typeof provider?.execute).toBe('function');
  });

  it('should return null for invalid provider identifier', async () => {
    const { loadProviderByIdentifier } = await import('../deployment/index.js');

    const provider = await loadProviderByIdentifier('@invalid/provider');

    expect(provider).toBeNull();
  });

  it('should get deployment providers synchronously', async () => {
    const { getDeploymentProvidersSync } = await import(
      '../deployment/index.js'
    );

    const providers = getDeploymentProvidersSync();

    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);

    // Should include local provider
    const localProvider = providers.find((p) => p.name === 'local');
    expect(localProvider).toBeDefined();

    // Should include cloudflare provider (built-in)
    const cloudflareProvider = providers.find((p) => p.name === 'cloudflare');
    expect(cloudflareProvider).toBeDefined();
  });

  it('should export BUILT_IN_PROVIDERS', async () => {
    const { BUILT_IN_PROVIDERS } = await import('@xnok/emma-shared');

    expect(BUILT_IN_PROVIDERS).toBeDefined();
    expect(Array.isArray(BUILT_IN_PROVIDERS)).toBe(true);
    expect(BUILT_IN_PROVIDERS).toContain('@xnok/emma-provider-cloudflare');
  });

  it('should discover providers asynchronously', async () => {
    const { getDeploymentProviders } = await import('../deployment/index.js');

    const providers = await getDeploymentProviders();

    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });
});
