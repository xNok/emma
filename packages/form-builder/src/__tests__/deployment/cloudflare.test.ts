import {
  describe,
  it,
  beforeEach,
  expect,
  vi,
  afterEach,
  type Mock,
  type SpyInstance,
} from 'vitest';
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
  let exitSpy: SpyInstance<[code?: string | number | null | undefined], never>;
  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with "${String(code)}"`);
      });
  });
  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('should register provider correctly', () => {
    expect(cloudflareProvider.name).toBe('cloudflare');
    expect(typeof cloudflareProvider.init).toBe('function');
    expect(typeof cloudflareProvider.execute).toBe('function');
  });

  it('should run init and save config', async () => {
    (inquirer.prompt as unknown as Mock).mockResolvedValueOnce({
      setupMode: 'existing',
    });
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

  it('should handle bucket creation', async () => {
    (inquirer.prompt as unknown as Mock).mockResolvedValueOnce({
      setupMode: 'create',
    });
    (inquirer.prompt as unknown as Mock).mockResolvedValueOnce({
      accountId: 'test-account',
      apiToken: 'test-token',
      bucket: 'new-bucket',
      publicUrl: 'https://new-bucket.r2.cloudflarestorage.com',
    });
    // Mock spawnSync for bucket creation
    vi.mock('child_process', async () => {
      const actual =
        await vi.importActual<typeof import('child_process')>('child_process');

      return {
        ...actual,
        spawnSync: () => ({ status: 0 }),
      };
    });
    if (typeof cloudflareProvider.init === 'function') {
      await cloudflareProvider.init(realConfig);
    }
    expect(realConfig.get('cloudflare')).toEqual({
      bucket: 'new-bucket',
      publicUrl: 'https://new-bucket.r2.cloudflarestorage.com',
      accountId: 'test-account',
    });
  });

  it('should execute deployment', async () => {
    const options = { bucket: 'bucket', publicUrl: 'url' };
    // Avoid actually calling wrangler in CI by mocking runWrangler to fail
    vi.spyOn(
      CloudflareR2Deployment.prototype as unknown as {
        runWrangler: (args: string[]) => Promise<void>;
      },
      'runWrangler'
    ).mockRejectedValue(new Error('simulated wrangler failure'));

    await expect(
      cloudflareProvider.execute(realConfig, 'form-id', options)
    ).rejects.toThrow('process.exit called with "1"');
  });
});
