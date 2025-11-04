import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { EmmaConfig } from '../config.js';
import { CloudflareR2Deployment } from '../deployment/cloudflare.js';

// Simple smoke test for constructing and validating options

describe('CloudflareR2Deployment', () => {
  it('throws when required options are missing', async () => {
    const config = new EmmaConfig(path.join(process.cwd(), '.tmp-emma-test'));
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
