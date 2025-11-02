import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { CloudflareR2Deployment } from '../deploy.js';

// Mock EmmaConfig interface
class MockEmmaConfig {
  constructor(private basePath: string) {}

  async initialize() {
    await fs.ensureDir(path.join(this.basePath, 'forms'));
    await fs.ensureDir(path.join(this.basePath, 'builds'));
  }

  async loadFormSchema(formId: string) {
    return {
      formId,
      name: 'Test Form',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: '/api/test',
      fields: [],
      currentSnapshot: Date.now(),
      snapshots: [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveFormSchema(_formId: string, _schema: unknown) {
    // No-op for tests
  }

  getBuildPath(formId: string): string {
    return path.join(this.basePath, 'builds', formId);
  }
}

// Simple smoke test for constructing and validating options

describe('CloudflareR2Deployment', () => {
  it('throws when required options are missing', async () => {
    const config = new MockEmmaConfig(
      path.join(process.cwd(), '.tmp-emma-test')
    );
    await config.initialize();

    // Create minimal build dir
    const formId = 'test-form-001';
    const buildDir = config.getBuildPath(formId);
    await fs.ensureDir(buildDir);
    await fs.writeFile(path.join(buildDir, `${formId}.js`), 'console.log(1)');

    const cf = new CloudflareR2Deployment(config);

    await expect(
      cf.deploy(formId, { bucket: '', publicUrl: '' })
    ).rejects.toThrow();
  });
});
