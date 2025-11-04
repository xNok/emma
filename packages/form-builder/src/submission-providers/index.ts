/**
 * Submission Providers Registry
 * Abstracts database access for viewing and exporting submissions
 */

import type {
  SubmissionRecord,
  SubmissionProviderDefinition,
  SubmissionQueryOptions,
} from '@xnok/emma-shared/types';

// Re-export types for backward compatibility
export type { SubmissionQueryOptions };

/**
 * Legacy interface for backward compatibility
 * @deprecated Use SubmissionProviderDefinition from @xnok/emma-shared/types
 */
export interface SubmissionProvider extends SubmissionProviderDefinition {
  querySubmissions(
    options: SubmissionQueryOptions
  ): Promise<SubmissionRecord[]>;
}

/**
 * Get the configured submission provider
 */
export async function getSubmissionProvider(): Promise<SubmissionProvider | null> {
  // For now, we only support Cloudflare D1
  // In the future, this could check config and return the appropriate provider
  const { cloudflareD1Provider } = await import('./cloudflare.js');

  if (await cloudflareD1Provider.isAvailable?.()) {
    return cloudflareD1Provider as SubmissionProvider;
  }

  return null;
}
