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
vi.spyOn(realConfig, 'loadFormSchema').mockResolvedValue({
  formId: 'form-id',
  name: 'Test Form',
  version: '1.0',
  apiEndpoint: '/api/test',
  fields: [],
  theme: 'default',
});

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

    expect(mockSend).toHaveBeenCalledTimes(5);

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

    expect(findCall('form-id/form-id.js')).toBeDefined();
    expect(findCall('form-id/themes/default.css')).toBeDefined();
    expect(findCall('form-id/index.html')).toBeDefined();
    expect(findCall('form-id/emma-forms.esm.js')).toBeDefined();
    const schemaCall = findCall('form-id/form-id.json');
    expect(schemaCall).toBeDefined();
    if (schemaCall) {
      expect(JSON.parse(schemaCall.Body as string)).toEqual({
        formId: 'form-id',
        name: 'Test Form',
        version: '1.0',
        apiEndpoint: '/api/test',
        fields: [],
        theme: 'default',
      });
    }
  });
});
