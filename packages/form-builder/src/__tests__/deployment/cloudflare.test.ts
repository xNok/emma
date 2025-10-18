import { describe, it, beforeEach, expect, vi, type Mock } from 'vitest';
import {
  cloudflareProvider,
  CloudflareR2Deployment,
} from '../../deployment/cloudflare';
import inquirer from 'inquirer';
import { EmmaConfig } from '../../config';

vi.mock('inquirer');

const realConfig = new EmmaConfig('/tmp/emma-test-config');
const saveSpy = vi.spyOn(realConfig, 'save').mockImplementation(async () => {});
vi.spyOn(realConfig, 'isInitialized').mockReturnValue(true);

const mockSchema = {
  formId: 'form-id',
  name: 'Test Form',
  version: '1.0',
  apiEndpoint: '/api/test',
  fields: [],
  theme: 'default',
  createdAt: 1760743545,
  lastModified: 1760743545,
  currentSnapshot: 1760743545,
  snapshots: [
    {
      timestamp: 1760743545,
      r2Key: 'form-id-1760743545.js',
      changes: 'Initial version',
      deployed: false,
    },
  ],
};

vi.spyOn(realConfig, 'loadFormSchema').mockResolvedValue(mockSchema);
vi.spyOn(realConfig, 'saveFormSchema').mockImplementation(async () => {});

describe('cloudflareProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  // No afterEach needed

  it('should register provider correctly', () => {
    expect(cloudflareProvider.name).toBe('cloudflare');
    expect(typeof cloudflareProvider.init).toBe('function');
    expect(typeof cloudflareProvider.execute).toBe('function');
  });

  it('should run init and save config (S3-only)', async () => {
    (inquirer.prompt as unknown as Mock).mockResolvedValueOnce({
      bucket: 'test-bucket',
      publicUrl: 'https://test-bucket.r2.cloudflarestorage.com',
      accountId: 'test-account',
    });
    if (typeof cloudflareProvider.init === 'function') {
      await cloudflareProvider.init(realConfig);
    }
    expect(realConfig.get('cloudflare')).toEqual({
      bucket: 'test-bucket',
      publicUrl: 'https://test-bucket.r2.cloudflarestorage.com',
      accountId: 'test-account',
    });
    expect(saveSpy).toHaveBeenCalled();
  });

  // S3-only: no bucket creation test needed

  it('should upload all form assets to R2', async () => {
    const fs = await import('fs-extra');

    // Create the required bundle file
    const buildDir = '/tmp/emma-test-config/builds/form-id';
    await fs.ensureDir(buildDir);
    await fs.ensureDir(`${buildDir}/themes`);
    await fs.writeFile(`${buildDir}/form-id-1760743545.js`, 'bundle content');
    await fs.writeFile(`${buildDir}/themes/default.css`, 'theme css');
    await fs.writeFile(`${buildDir}/index.html`, 'index html');
    await fs.writeFile(`${buildDir}/emma-forms.esm.js`, 'renderer js');

    const options = {
      bucket: 'test-bucket',
      publicUrl: 'https://forms.example.com',
      accessKeyId: 'fake-key',
      secretAccessKey: 'fake-secret',
      accountId: 'test-account',
      overwrite: true,
    };

    const mockSend = vi.fn().mockResolvedValue({});
    (
      CloudflareR2Deployment.prototype as unknown as {
        getS3Client: () => { send: Mock };
      }
    ).getS3Client = () => ({ send: mockSend });

    await cloudflareProvider.execute(realConfig, 'form-id', options);

    // Should upload 6 things: bundle, theme, index, renderer, schema, registry
    // Plus 1 GET to check for existing registry
    expect(mockSend.mock.calls.length).toBeGreaterThanOrEqual(6);

    const findCall = (key: string) => {
      const call = (
        mockSend.mock.calls as [
          {
            input: {
              Key: string;
              Body: string | Buffer;
            };
          },
        ][]
      ).find((c) => c[0].input.Key === key);
      return call?.[0].input;
    };

    // Check for timestamp-based bundle key
    expect(findCall('form-id-1760743545.js')).toBeDefined();
    expect(findCall('form-id/themes/default.css')).toBeDefined();
    expect(findCall('form-id/index.html')).toBeDefined();
    expect(findCall('form-id/emma-forms.esm.js')).toBeDefined();
    const schemaCall = findCall('form-id/form-id.json');
    expect(schemaCall).toBeDefined();
    // Check for registry
    const registryCall = findCall('registry.json');
    expect(registryCall).toBeDefined();
    if (registryCall && registryCall.Body) {
      const registry = JSON.parse(registryCall.Body.toString()) as {
        forms: Array<{ formId: string; currentSnapshot: number }>;
      };
      expect(registry.forms).toHaveLength(1);
      expect(registry.forms[0].formId).toBe('form-id');
      expect(registry.forms[0].currentSnapshot).toBe(1760743545);
    }

    // Clean up
    await fs.remove('/tmp/emma-test-config/builds');
  });
});
