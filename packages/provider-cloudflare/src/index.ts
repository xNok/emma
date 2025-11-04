/**
 * Cloudflare Provider for Emma Forms
 * Exports deployment and submission providers for Cloudflare R2 and D1
 */

import type { ProviderManifest } from '@xnok/emma-shared/types';
import { cloudflareD1Provider } from './submission.js';

// Export deployment implementation
export {
  CloudflareR2Deployment,
  type CloudflareDeploymentOptions,
  type CloudflareDeploymentResult,
  type EmmaConfigInterface,
} from './deploy.js';

// Export submission provider
export { cloudflareD1Provider } from './submission.js';

// Export API worker deployment
export {
  ApiWorkerDeployment,
  type ApiWorkerDeploymentOptions,
  type ApiWorkerDeploymentResult,
} from './api-worker.js';

// Export provider definition (for CLI)
export { cloudflareProvider, createCloudflareProvider } from './provider.js';

/**
 * Provider manifest for Cloudflare
 */
export const cloudflareProviderManifest: ProviderManifest = {
  name: 'cloudflare',
  displayName: 'Cloudflare R2 + D1',
  description: 'Deploy forms to Cloudflare R2 and query submissions from D1',
  packageName: '@xnok/emma-provider-cloudflare',
  version: '0.1.0',
  capabilities: ['deploy', 'submission-query', 'migrations'],
  async isAvailable() {
    // Check if environment variables are set
    const hasR2Credentials =
      !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_SECRET_ACCESS_KEY;
    const hasCloudflareToken = !!process.env.CLOUDFLARE_API_TOKEN;
    const hasD1Database = (await cloudflareD1Provider.isAvailable?.()) ?? false;

    return hasR2Credentials || hasCloudflareToken || hasD1Database;
  },
};

/**
 * Default export - the provider manifest
 */
export default cloudflareProviderManifest;
