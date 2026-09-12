import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cloudflareEmailDriver, cloudflareDriver } from '../email.js';

describe('Cloudflare Email Driver', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete (globalThis as any).__env__;
    delete (globalThis as any).EMAIL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should export alias cloudflareDriver identical to cloudflareEmailDriver', () => {
    expect(cloudflareDriver).toBe(cloudflareEmailDriver);
  });

  describe('verify()', () => {
    it('should return true if binding is present in options', async () => {
      const driver = cloudflareEmailDriver({
        binding: { send: vi.fn() },
      });
      const isVerified = await driver.verify?.();
      expect(isVerified).toBe(true);
    });

    it('should return true if global binding EMAIL is present', async () => {
      (globalThis as any).EMAIL = { send: vi.fn() };
      const driver = cloudflareEmailDriver({});
      const isVerified = await driver.verify?.();
      expect(isVerified).toBe(true);
    });

    it('should return true if accountId and apiToken are provided', async () => {
      const driver = cloudflareEmailDriver({
        accountId: 'acc123',
        apiToken: 'tok456',
      });
      const isVerified = await driver.verify?.();
      expect(isVerified).toBe(true);
    });

    it('should return false if neither binding nor REST API tokens are provided', async () => {
      const driver = cloudflareEmailDriver({});
      const isVerified = await driver.verify?.();
      expect(isVerified).toBe(false);
    });
  });

  describe('send() with native Worker binding', () => {
    it('should send email using options binding', async () => {
      const mockSend = vi.fn().mockResolvedValue({ messageId: 'msg-123' });
      const driver = cloudflareEmailDriver({
        binding: { send: mockSend },
      });

      const result = await driver.send({
        to: 'user@example.com',
        from: { name: 'Form Bot', email: 'bot@example.com' },
        subject: 'New Submission',
        text: 'Form contents here',
        html: '<p>Form contents here</p>',
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: ['user@example.com'],
        from: 'Form Bot <bot@example.com>',
        subject: 'New Submission',
        text: 'Form contents here',
        html: '<p>Form contents here</p>',
        replyTo: undefined,
        cc: undefined,
        bcc: undefined,
        headers: undefined,
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg-123',
        provider: 'cloudflare',
        rawResponse: { messageId: 'msg-123' },
      });
    });

    it('should format string from address correctly', async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      const driver = cloudflareEmailDriver({
        binding: { send: mockSend },
      });

      await driver.send({
        to: ['a@example.com', 'b@example.com'],
        from: 'admin@example.com',
        subject: 'Test Subject',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['a@example.com', 'b@example.com'],
          from: 'admin@example.com',
        })
      );
    });

    it('should handle errors thrown by Worker binding', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Binding failed'));
      const driver = cloudflareEmailDriver({
        binding: { send: mockSend },
      });

      const result = await driver.send({
        to: 'user@example.com',
        from: 'bot@example.com',
        subject: 'Fail Test',
      });

      expect(result).toEqual({
        success: false,
        messageId: '',
        provider: 'cloudflare',
        error: {
          code: 'WORKER_BINDING_ERROR',
          message: 'Binding failed',
          retryable: true,
        },
      });
    });
  });

  describe('send() with REST API fallback', () => {
    it('should call Cloudflare REST API when credentials are provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          result: { id: 'api-msg-789' },
        }),
      });
      global.fetch = mockFetch as any;

      const driver = cloudflareEmailDriver({
        accountId: 'test-account',
        apiToken: 'test-token',
      });

      const result = await driver.send({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'API Email',
        text: 'Hello API',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/accounts/test-account/email/sending/send',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: ['recipient@example.com'],
            from: 'sender@example.com',
            subject: 'API Email',
            text: 'Hello API',
          }),
        }
      );

      expect(result).toEqual({
        success: true,
        messageId: 'api-msg-789',
        provider: 'cloudflare',
        rawResponse: {
          success: true,
          result: { id: 'api-msg-789' },
        },
      });
    });

    it('should handle Cloudflare API error response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          errors: [{ code: 1001, message: 'Invalid recipient domain' }],
        }),
      });
      global.fetch = mockFetch as any;

      const driver = cloudflareEmailDriver({
        accountId: 'test-account',
        apiToken: 'test-token',
      });

      const result = await driver.send({
        to: 'invalid@domain',
        from: 'sender@example.com',
        subject: 'API Fail',
      });

      expect(result).toEqual({
        success: false,
        messageId: '',
        provider: 'cloudflare',
        rawResponse: {
          success: false,
          errors: [{ code: 1001, message: 'Invalid recipient domain' }],
        },
        error: {
          code: '1001',
          message: 'Invalid recipient domain',
          retryable: false,
        },
      });
    });

    it('should catch network errors in REST API fallback', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline')) as any;

      const driver = cloudflareEmailDriver({
        accountId: 'test-account',
        apiToken: 'test-token',
      });

      const result = await driver.send({
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Network Test',
      });

      expect(result).toEqual({
        success: false,
        messageId: '',
        provider: 'cloudflare',
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network offline',
          retryable: true,
        },
      });
    });
  });

  it('should throw Error if neither binding nor REST API tokens are provided', async () => {
    const driver = cloudflareEmailDriver({});

    await expect(
      driver.send({
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Unconfigured Test',
      })
    ).rejects.toThrow(
      'Cloudflare email driver missing EMAIL binding or accountId/apiToken'
    );
  });
});
