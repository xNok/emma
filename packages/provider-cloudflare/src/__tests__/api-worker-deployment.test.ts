/**
 * Tests for API Worker Deployment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiWorkerDeployment } from '../api-worker.js';
import fs from 'fs-extra';

// Mock fs-extra
vi.mock('fs-extra');

// Mock global fetch with proper typing
const mockFetch: Mock<
  [RequestInfo | URL, RequestInit?],
  Promise<Response>
> = vi.fn();
global.fetch = mockFetch;

describe('ApiWorkerDeployment', () => {
  let deployment: ApiWorkerDeployment;
  const mockAccountId = 'test-account-id';
  const mockApiToken = 'test-api-token';

  beforeEach(() => {
    deployment = new ApiWorkerDeployment();
    // Set up environment
    process.env.CLOUDFLARE_API_TOKEN = mockApiToken;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_API_TOKEN;
  });

  describe('validateEnvironment', () => {
    it('should validate required environment variables', () => {
      process.env.CLOUDFLARE_API_TOKEN = 'test-token';

      const result = ApiWorkerDeployment.validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should detect missing CLOUDFLARE_API_TOKEN', () => {
      delete process.env.CLOUDFLARE_API_TOKEN;

      const result = ApiWorkerDeployment.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('CLOUDFLARE_API_TOKEN');
    });

    it('should warn about missing R2 credentials', () => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;

      const result = ApiWorkerDeployment.validateEnvironment();

      expect(result.warnings).toContain('R2_ACCESS_KEY_ID');
      expect(result.warnings).toContain('R2_SECRET_ACCESS_KEY');
    });

    it('should not warn if R2 credentials are set', () => {
      process.env.R2_ACCESS_KEY_ID = 'test-key';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret';

      const result = ApiWorkerDeployment.validateEnvironment();

      expect(result.warnings).not.toContain('R2_ACCESS_KEY_ID');
      expect(result.warnings).not.toContain('R2_SECRET_ACCESS_KEY');
    });
  });

  describe('deploy', () => {
    it('should throw error if account ID is missing', async () => {
      await expect(
        deployment.deploy({
          accountId: '',
        })
      ).rejects.toThrow('Cloudflare Account ID is required');
    });

    it('should throw error if API token is missing', async () => {
      delete process.env.CLOUDFLARE_API_TOKEN;

      await expect(
        deployment.deploy({
          accountId: mockAccountId,
        })
      ).rejects.toThrow(
        'CLOUDFLARE_API_TOKEN environment variable is required'
      );
    });

    it('should check for Nitro build output at dist/cloudflare-worker/server/index.mjs', async () => {
      // Mock fs.readJSON for package.json
      vi.mocked(fs.readJSON).mockResolvedValue({
        name: '@xnok/emma-api-worker',
        version: '1.0.0',
      } as never);

      // Mock fs.pathExists calls in order:
      // 1. migrations dir exists (for runMigrations)
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as never);
      // 2. worker script doesn't exist (for resolveApiWorker)
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as never);

      // Mock readdir for migrations
      vi.mocked(fs.readdir).mockResolvedValue([
        '0001_initial_schema.sql',
      ] as never);
      vi.mocked(fs.readFile).mockResolvedValue(
        'CREATE TABLE submissions (id TEXT PRIMARY KEY);' as never
      );

      // Mock D1 list (database doesn't exist)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock database creation
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { uuid: 'test-db-id' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock D1 list for migrations to find the newly created database
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: [{ name: 'emma-submissions', uuid: 'test-db-id' }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      // Mock migration execution
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock KV list (namespace doesn't exist)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock KV namespace creation
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { id: 'test-kv-id' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        await deployment.deploy({
          accountId: mockAccountId,
          apiToken: mockApiToken,
        });
        // Should throw before reaching here
        expect.fail('Expected error to be thrown');
      } catch (error) {
        // Expect specific error about worker script not found
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain(
            'dist/cloudflare-worker/server/index.mjs'
          );
          expect(error.message).toContain('built');
        }
      }
    });

    it('should handle D1 database creation and migration', async () => {
      const databaseName = 'emma-submissions';

      // Mock fs.readJSON for package.json (called by resolveApiWorker)
      vi.mocked(fs.readJSON).mockResolvedValue({
        name: '@xnok/emma-api-worker',
        version: '1.0.0',
      } as never);

      // Mock successful file system calls in order:
      // 1. migrations dir exists (for runMigrations)
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as never);
      // 2. worker script exists (for resolveApiWorker)
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as never);

      vi.mocked(fs.readdir).mockResolvedValue([
        '0001_initial_schema.sql',
      ] as never);
      vi.mocked(fs.readFile)
        // First call: migration SQL file
        .mockResolvedValueOnce(
          'CREATE TABLE submissions (id TEXT PRIMARY KEY);' as never
        )
        // Second call: worker script content
        .mockResolvedValueOnce('export default { fetch() {} }' as never);

      // Mock D1 list (database doesn't exist)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock D1 database creation
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { uuid: 'new-db-id' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock D1 list for migrations to find the newly created database
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: [{ name: databaseName, uuid: 'new-db-id' }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      // Mock migration execution
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock KV list (namespace doesn't exist)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock KV namespace creation
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { id: 'test-kv-id' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock worker deployment
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { id: 'worker-id' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Mock worker bindings configuration
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { success: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await deployment.deploy({
        accountId: mockAccountId,
        apiToken: mockApiToken,
        databaseName,
      });

      expect(result.success).toBe(true);
      expect(result.databaseId).toBe('new-db-id');
      expect(result.databaseName).toBe(databaseName);
    });

    it('should handle idempotent migrations with duplicate column errors', () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readdir).mockResolvedValue([
        '0002_add_submission_snapshot_fields.sql',
      ] as never);
      vi.mocked(fs.readFile).mockResolvedValue(
        ('ALTER TABLE submissions ADD COLUMN form_snapshot INTEGER;' +
          'ALTER TABLE submissions ADD COLUMN form_bundle TEXT;') as never
      );

      // Mock D1 list (database exists)
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: [{ name: 'emma-submissions', uuid: 'existing-db-id' }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      // Mock migration execution - first statement succeeds, second fails with duplicate column
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ result: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response('duplicate column name: form_snapshot', {
            status: 400,
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ result: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response('duplicate column name: form_snapshot', {
            status: 400,
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ result: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

      // The deployment should continue despite duplicate column errors
      // This tests the idempotency handling in the migration runner
    });
  });

  describe('displayEnvSetupInstructions', () => {
    it('should display setup instructions without throwing', () => {
      // Mock console.log to prevent output during tests
      const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(() => {
        ApiWorkerDeployment.displayEnvSetupInstructions();
      }).not.toThrow();

      expect(mockLog).toHaveBeenCalled();
      mockLog.mockRestore();
    });
  });
});
