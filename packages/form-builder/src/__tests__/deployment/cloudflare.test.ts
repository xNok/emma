
import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest';
import { cloudflareProvider } from '../../deployment/cloudflare';
import inquirer from 'inquirer';
import { EmmaConfig } from '../../config';
import { FormManager } from '../../form-manager';

vi.mock('inquirer');


const realConfig = new EmmaConfig('/tmp/emma-test-config');
vi.spyOn(realConfig, 'save').mockImplementation(async () => {});
vi.spyOn(realConfig, 'set').mockImplementation((key: string, value: any) => { (realConfig as any).data = (realConfig as any).data || {}; (realConfig as any).data[key] = value; });
vi.spyOn(realConfig, 'get').mockImplementation((key: string) => (realConfig as any).data ? (realConfig as any).data[key] : undefined);
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
  let exitSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.clearAllMocks();
      exitSpy = vi.spyOn(process, 'exit').mockImplementation((...args: unknown[]) => {
        throw new Error(`process.exit called with "${args[0]}"`);
      }) as any;
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
    (inquirer.prompt as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ setupMode: 'existing' });
    (inquirer.prompt as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      bucket: 'test-bucket',
      publicUrl: 'https://test-bucket.r2.cloudflarestorage.com',
      accountId: 'test-account',
    });
    if (typeof cloudflareProvider.init === 'function') {
      await cloudflareProvider.init(realConfig);
    }
    expect(realConfig.set).toHaveBeenCalledWith('cloudflare', {
      bucket: 'test-bucket',
      publicUrl: 'https://test-bucket.r2.cloudflarestorage.com',
      accountId: 'test-account',
    });
    expect(realConfig.save).toHaveBeenCalled();
  });

  it('should handle bucket creation', async () => {
    (inquirer.prompt as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ setupMode: 'create' });
    (inquirer.prompt as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      accountId: 'test-account',
      apiToken: 'test-token',
      bucket: 'new-bucket',
      publicUrl: 'https://new-bucket.r2.cloudflarestorage.com',
    });
    // Mock spawnSync for bucket creation
    vi.mock('child_process', () => ({
      spawnSync: () => ({ status: 0 })
    }));
    if (typeof cloudflareProvider.init === 'function') {
      await cloudflareProvider.init(realConfig);
    }
    expect(realConfig.set).toHaveBeenCalledWith('cloudflare', {
      bucket: 'new-bucket',
      publicUrl: 'https://new-bucket.r2.cloudflarestorage.com',
      accountId: 'test-account',
    });
  });

  it('should execute deployment', async () => {
    const options = { bucket: 'bucket', publicUrl: 'url' };
    await expect(cloudflareProvider.execute(realConfig, 'form-id', options))
      .rejects.toThrow('process.exit called with "1"');
  });
});
