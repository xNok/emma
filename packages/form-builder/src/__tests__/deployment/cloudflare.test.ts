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

  it('should execute deployment (S3-only, always succeeds)', async () => {
    const options = {
      bucket: 'bucket',
      publicUrl: 'https://bucket.r2.cloudflarestorage.com',
      accessKeyId: 'fake-key',
      secretAccessKey: 'fake-secret',
      accountId: 'test-account',
    };
    // Mock S3Client and its send method:
    // - HeadObjectCommand always throws 404 (object not found)
    // - All other commands resolve
    // Mock getS3Client on the prototype for all instances
    (
      CloudflareR2Deployment.prototype as unknown as {
        getS3Client: () => {
          send: (cmd: { constructor: { name: string } }) => Promise<unknown>;
        };
      }
    ).getS3Client = () => {
      return {
        send: vi
          .fn()
          .mockImplementation((cmd: { constructor: { name: string } }) => {
            if (cmd.constructor.name === 'HeadObjectCommand') {
              const err = new Error('NotFound') as Error & {
                $metadata?: { httpStatusCode: number };
              };
              err.$metadata = { httpStatusCode: 404 };
              throw err;
            }
            return Promise.resolve({});
          }),
      };
    };
    await expect(
      cloudflareProvider.execute(realConfig, 'form-id', options)
    ).resolves.not.toThrow();
  });
});
