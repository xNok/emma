import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveApiWorker, getApiWorkerVersion } from '../api-worker-resolver';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('API Worker Resolver', () => {
  let tempDir: string;
  let mockPackageDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-worker-test-'));
    mockPackageDir = path.join(
      tempDir,
      'node_modules',
      '@xnok',
      'emma-api-worker'
    );

    // Create mock package structure
    await fs.ensureDir(mockPackageDir);
    await fs.ensureDir(
      path.join(mockPackageDir, 'dist', 'cloudflare-worker', 'server')
    );
    await fs.ensureDir(
      path.join(mockPackageDir, 'dist', 'node-server', 'server')
    );

    // Create mock package.json
    await fs.writeJSON(path.join(mockPackageDir, 'package.json'), {
      name: '@xnok/emma-api-worker',
      version: '0.4.0',
    });

    // Create mock worker scripts
    await fs.writeFile(
      path.join(
        mockPackageDir,
        'dist',
        'cloudflare-worker',
        'server',
        'index.mjs'
      ),
      'export default { fetch: () => new Response("cloudflare") };'
    );
    await fs.writeFile(
      path.join(mockPackageDir, 'dist', 'node-server', 'server', 'index.mjs'),
      'export default { fetch: () => new Response("node") };'
    );
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  describe('resolveApiWorker', () => {
    it('should resolve cloudflare worker script', async () => {
      // Mock require.resolve to return our test package
      const originalResolve = require.resolve;
      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          return path.join(mockPackageDir, 'package.json');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      const result = await resolveApiWorker({ platform: 'cloudflare' });

      expect(result.packageVersion).toBe('0.4.0');
      expect(result.scriptContent).toContain('cloudflare');
      expect(result.scriptPath).toContain(
        'dist/cloudflare-worker/server/index.mjs'
      );
      expect(result.packageDir).toBe(mockPackageDir);

      // Restore original require.resolve
      require.resolve = originalResolve;
    });

    it('should resolve node worker script', async () => {
      const originalResolve = require.resolve;
      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          return path.join(mockPackageDir, 'package.json');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      const result = await resolveApiWorker({ platform: 'node' });

      expect(result.packageVersion).toBe('0.4.0');
      expect(result.scriptContent).toContain('node');
      expect(result.scriptPath).toContain('dist/node-server/server/index.mjs');

      require.resolve = originalResolve;
    });

    it('should throw error if package not found', async () => {
      const originalResolve = require.resolve;
      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          throw new Error('Cannot find module');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      await expect(
        resolveApiWorker({ platform: 'cloudflare' })
      ).rejects.toThrow("Fatal: '@xnok/emma-api-worker' not found");

      require.resolve = originalResolve;
    });

    it('should throw error if built script not found', async () => {
      const originalResolve = require.resolve;
      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          return path.join(mockPackageDir, 'package.json');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      // Remove the built script
      await fs.remove(path.join(mockPackageDir, 'dist', 'cloudflare-worker'));
      await fs.remove(path.join(mockPackageDir, 'dist', 'cloudflare'));

      await expect(
        resolveApiWorker({ platform: 'cloudflare' })
      ).rejects.toThrow('Could not find pre-built file');

      require.resolve = originalResolve;
    });

    it('should warn if version mismatch', async () => {
      const originalResolve = require.resolve;
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          return path.join(mockPackageDir, 'package.json');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      await resolveApiWorker({
        platform: 'cloudflare',
        version: '2.0.0', // Different from actual version
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Requested version 2.0.0 but found 0.4.0')
      );

      consoleWarnSpy.mockRestore();
      require.resolve = originalResolve;
    });
  });

  describe('getApiWorkerVersion', () => {
    it('should return package version', async () => {
      const originalResolve = require.resolve;
      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          return path.join(mockPackageDir, 'package.json');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      const version = await getApiWorkerVersion();
      expect(version).toBe('0.4.0');

      require.resolve = originalResolve;
    });

    it('should return null if package not found', async () => {
      const originalResolve = require.resolve;
      require.resolve = ((id: string, options?: { paths?: string[] }) => {
        if (
          id === '@xnok/emma-api-worker/package.json' ||
          id.startsWith('@xnok/emma-api-worker/package.json')
        ) {
          throw new Error('Cannot find module');
        }
        return originalResolve(id, options);
      }) as typeof require.resolve;

      const version = await getApiWorkerVersion();
      expect(version).toBeNull();

      require.resolve = originalResolve;
    });
  });
});
