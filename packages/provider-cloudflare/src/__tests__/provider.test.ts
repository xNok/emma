/**
 * Basic tests for Cloudflare Provider
 */

import { describe, it, expect } from 'vitest';
import { cloudflareProviderManifest } from '../index.js';

describe('Cloudflare Provider', () => {
  it('should have correct manifest properties', () => {
    expect(cloudflareProviderManifest.name).toBe('cloudflare');
    expect(cloudflareProviderManifest.packageName).toBe('@emma/provider-cloudflare');
    expect(cloudflareProviderManifest.capabilities).toContain('deploy');
    expect(cloudflareProviderManifest.capabilities).toContain('submission-query');
  });

  it('should export deployment functionality', async () => {
    const { CloudflareR2Deployment } = await import('../deploy.js');
    expect(CloudflareR2Deployment).toBeDefined();
  });

  it('should export submission provider', async () => {
    const { cloudflareD1Provider } = await import('../submission.js');
    expect(cloudflareD1Provider).toBeDefined();
    expect(cloudflareD1Provider.name).toBe('cloudflare-d1');
  });
});
