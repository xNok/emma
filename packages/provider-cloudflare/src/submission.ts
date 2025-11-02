/**
 * Cloudflare D1 Submission Provider
 * Provides database access for submissions via wrangler D1
 */

import { spawn } from 'child_process';
import type {
  SubmissionProviderDefinition,
  SubmissionQueryOptions,
  SubmissionRecord,
} from '@xnok/emma-shared/types';

/**
 * Escape SQL string values to prevent injection
 */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Validate and sanitize numeric values
 */
function sanitizeNumeric(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Invalid numeric value');
  }
  return Math.floor(value);
}

/**
 * Execute wrangler d1 query and return results
 */
async function executeD1Query(
  databaseName: string,
  query: string
): Promise<SubmissionRecord[]> {
  return new Promise((resolve, reject) => {
    // Build wrangler command with query
    const args = ['d1', 'execute', databaseName, '--command', query];

    // Add JSON output flag
    args.push('--json');

    const proc = spawn('wrangler', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Wrangler command failed: ${stderr}`));
        return;
      }

      try {
        // Parse wrangler output (it returns an array with one result object)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const output = JSON.parse(stdout);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (Array.isArray(output) && output.length > 0 && output[0].results) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          resolve(output[0].results as SubmissionRecord[]);
        } else {
          resolve([]);
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        reject(new Error(`Failed to parse wrangler output: ${error}`));
      }
    });
  });
}

/**
 * Check if wrangler is available
 */
async function isWranglerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('wrangler', ['--version'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

export const cloudflareD1Provider: SubmissionProviderDefinition = {
  name: 'cloudflare-d1',
  description: 'Cloudflare D1 database via wrangler',
  capabilities: ['submission-query'],

  async isAvailable(): Promise<boolean> {
    // Check if wrangler is available and CLOUDFLARE_DATABASE_NAME is set
    if (!process.env.CLOUDFLARE_DATABASE_NAME) {
      return false;
    }

    return await isWranglerAvailable();
  },

  async querySubmissions(
    options: SubmissionQueryOptions
  ): Promise<SubmissionRecord[]> {
    const databaseName =
      process.env.CLOUDFLARE_DATABASE_NAME || 'emma-forms-db';

    // Destructure and sanitize inputs
    const { formId, snapshot, status, limit = 50, offset } = options;

    // Escape string values to prevent SQL injection
    const escapedFormId = escapeSqlString(formId);

    // Build query with properly sanitized values
    let query = `SELECT id, form_id, data, meta, spam_score, status, created_at, form_snapshot, form_bundle FROM submissions WHERE form_id = '${escapedFormId}'`;

    if (snapshot !== undefined) {
      const sanitizedSnapshot = sanitizeNumeric(snapshot);
      query += ` AND form_snapshot = ${sanitizedSnapshot}`;
    }

    if (status) {
      const escapedStatus = escapeSqlString(status);
      query += ` AND status = '${escapedStatus}'`;
    }

    const sanitizedLimit = sanitizeNumeric(limit);
    query += ` ORDER BY created_at DESC LIMIT ${sanitizedLimit}`;

    if (offset !== undefined) {
      const sanitizedOffset = sanitizeNumeric(offset);
      query += ` OFFSET ${sanitizedOffset}`;
    }

    return await executeD1Query(databaseName, query);
  },
};
