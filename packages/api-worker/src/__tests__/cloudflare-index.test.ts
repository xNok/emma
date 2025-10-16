import { describe, it, expect, vi } from 'vitest';
import cloudflareIndex from '../cloudflare-index';
import { Env } from '../env';
import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { D1SubmissionRepository } from '../data/submission-repository';
import { KvCacheSchemaRepository } from '../data/schema-repository';

import { ExecutionContext } from '@cloudflare/workers-types';

describe('Cloudflare Index', () => {
  it('should create and inject repositories', async () => {
    const mockEnv: Env = {
      DB: {} as D1Database,
      CDN_URL: 'https://example.com',
      SCHEMA_CACHE: {} as KVNamespace,
      submissionRepository: new D1SubmissionRepository({} as D1Database),
      ENVIRONMENT: 'test',
      RATE_LIMIT_REQUESTS: '100',
      RATE_LIMIT_WINDOW: '60',
      MAX_SUBMISSION_SIZE: '10000',
      ALLOWED_ORIGINS: '*',
    };

    const mockCtx: ExecutionContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
    const mockRequest = new Request('http://localhost');

    // Spy on the app.fetch method
    const appSpy = vi.spyOn(
      await import('../server').then((m) => m.default),
      'fetch'
    );

    await cloudflareIndex.fetch(mockRequest, mockEnv, mockCtx);

    expect(mockEnv.submissionRepository).toBeInstanceOf(D1SubmissionRepository);
    expect(mockEnv.schemaRepository).toBeInstanceOf(KvCacheSchemaRepository);
    expect(appSpy).toHaveBeenCalledWith(mockRequest, mockEnv, mockCtx);
  });
});
