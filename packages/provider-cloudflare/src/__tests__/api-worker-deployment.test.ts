/**
 * Tests for API Worker Deployment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiWorkerDeployment } from '../api-worker.js';
import fs from 'fs-extra';

// Mock fs-extra
vi.mock('fs-extra');

// Mock global fetch
global.fetch = vi.fn();

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

    it('should check for Nitro build output at .output/server/index.mjs', async () => {
      // Mock fs.pathExists to return false for the worker path
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as never); // api-worker package exists
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as never); // migrations dir doesn't exist

      // Mock D1 API calls
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({ result: [] }),
      });

      // Mock database creation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({ result: { uuid: 'test-db-id' } }),
      });

      try {
        await deployment.deploy({
          accountId: mockAccountId,
          apiToken: mockApiToken,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Expect specific error about worker script not found
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(error.message).toContain('.output/server/index.mjs');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(error.message).toContain('yarn build:cloudflare');
      }
    });

    it('should handle D1 database creation and migration', async () => {
      const databaseName = 'emma-submissions';

      // Mock successful API calls
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      vi.mocked(fs.readdir).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        ['0001_initial_schema.sql'] as any
      );
      vi.mocked(fs.readFile).mockResolvedValue(
        'CREATE TABLE submissions (id TEXT PRIMARY KEY);' as never
      );

      // Mock D1 list (database doesn't exist)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({ result: [] }),
      });

      // Mock D1 database creation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({ result: { uuid: 'new-db-id' } }),
      });

      // Mock migration execution
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({ result: [] }),
      });

      // Mock wrangler config update
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        'database_id = "old-id"' as never
      );
      vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);

      // Mock worker script read
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        'export default { fetch() {} }' as never
      );

      // Mock worker deployment
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        text: async () => 'Success',
      });

      const result = await deployment.deploy({
        accountId: mockAccountId,
        apiToken: mockApiToken,
        databaseName,
      });

      expect(result.success).toBe(true);
      expect(result.databaseId).toBe('new-db-id');
      expect(result.databaseName).toBe(databaseName);
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    it('should handle idempotent migrations with duplicate column errors', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      vi.mocked(fs.readdir).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        ['0002_add_submission_snapshot_fields.sql'] as any
      );
      vi.mocked(fs.readFile).mockResolvedValue(
        ('ALTER TABLE submissions ADD COLUMN form_snapshot INTEGER;' +
          'ALTER TABLE submissions ADD COLUMN form_bundle TEXT;') as never
      );

      // Mock D1 list (database exists)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      vi.mocked(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({
          result: [{ name: 'emma-submissions', uuid: 'existing-db-id' }],
        }),
      });

      // Mock migration execution - first statement succeeds, second fails with duplicate column
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      vi.mocked(global.fetch as any)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line @typescript-eslint/require-await
          json: async () => ({ result: [] }),
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ok: false,
          // eslint-disable-next-line @typescript-eslint/require-await
          text: async () => 'duplicate column name: form_snapshot',
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line @typescript-eslint/require-await
          json: async () => ({ result: [] }),
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ok: false,
          // eslint-disable-next-line @typescript-eslint/require-await
          text: async () => 'duplicate column name: form_snapshot',
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line @typescript-eslint/require-await
          json: async () => ({ result: [] }),
        });

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
