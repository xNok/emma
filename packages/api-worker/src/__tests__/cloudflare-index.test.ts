import { describe, it, expect, vi } from 'vitest';
import cloudflareIndex from '../cloudflare-index';
import { Env } from '../env';
import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { D1SubmissionRepository } from '../data/submission-repository';
import { KvCacheSchemaRepository } from '../data/schema-repository';
import { ExecutionContext } from '@cloudflare/workers-types';

describe('Cloudflare Index', () => {
  it('should handle requests and initialize repositories', async () => {
    const mockEnv: Env = {
      DB: {} as D1Database,
      CDN_URL: 'https://example.com',
      SCHEMA_CACHE: {} as KVNamespace,
      submissionRepository: new D1SubmissionRepository({} as D1Database),
      schemaRepository: new KvCacheSchemaRepository({} as KVNamespace, {
        getSchema: vi.fn(),
      }),
      ENVIRONMENT: 'test',
      RATE_LIMIT_REQUESTS: '100',
      RATE_LIMIT_WINDOW: '60',
      MAX_SUBMISSION_SIZE: '10000',
      ALLOWED_ORIGINS: '*',
    };

    const mockCtx: ExecutionContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      get props() {
        return {};
      },
    };
    const mockRequest = new Request('http://localhost/health');

    const response = await cloudflareIndex.fetch(mockRequest, mockEnv, mockCtx);

    // Check that a response was returned
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
