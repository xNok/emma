/**
 * Submission Providers Registry
 * Abstracts database access for viewing and exporting submissions
 */

import type { SubmissionRecord } from '@xnok/emma-shared/types';

export interface SubmissionQueryOptions {
  formId: string;
  snapshot?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface SubmissionProvider {
  name: string;
  description: string;

  /**
   * Query submissions from the database
   */
  querySubmissions(
    options: SubmissionQueryOptions
  ): Promise<SubmissionRecord[]>;

  /**
   * Check if provider is configured and available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Get the configured submission provider
 */
export async function getSubmissionProvider(): Promise<SubmissionProvider | null> {
  // For now, we only support Cloudflare D1
  // In the future, this could check config and return the appropriate provider
  const { cloudflareD1Provider } = await import('./cloudflare.js');

  if (await cloudflareD1Provider.isAvailable()) {
    return cloudflareD1Provider;
  }

  return null;
}
