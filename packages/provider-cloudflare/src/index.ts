/**
 * Cloudflare Provider for Emma Forms
 * Exports deployment and submission providers for Cloudflare R2 and D1
 */

import type {
  ProviderManifest,
  DeploymentProviderDefinition,
} from '@xnok/emma-shared/types';
import { cloudflareD1Provider } from './submission.js';

export { CloudflareR2Deployment, type CloudflareDeploymentOptions, type CloudflareDeploymentResult, type EmmaConfigInterface } from './deploy.js';
export { cloudflareD1Provider } from './submission.js';

/**
 * Provider manifest for Cloudflare
 */
export const cloudflareProviderManifest: ProviderManifest = {
  name: 'cloudflare',
  displayName: 'Cloudflare R2 + D1',
  description: 'Deploy forms to Cloudflare R2 and query submissions from D1',
  packageName: '@emma/provider-cloudflare',
  version: '0.1.0',
  capabilities: ['deploy', 'submission-query', 'migrations'],
  async isAvailable() {
    // Check if environment variables are set
    const hasR2Credentials =
      !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_SECRET_ACCESS_KEY;
    const hasCloudflareToken = !!process.env.CLOUDFLARE_API_TOKEN;
    const hasD1Database = await cloudflareD1Provider.isAvailable?.();
    
    return hasR2Credentials || hasCloudflareToken || (hasD1Database ?? false);
  },
};

/**
 * Create the deployment provider definition for CLI registration
 * This is created as a factory function so it can be imported into form-builder
 */
export function createCloudflareDeploymentProvider(): DeploymentProviderDefinition {
  return {
    name: 'cloudflare',
    description: 'Deploy to Cloudflare R2',
    capabilities: ['deploy'],
  };
}

/**
 * Default export - the provider manifest
 */
export default cloudflareProviderManifest;
