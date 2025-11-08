import { describe, it, expect, vi } from 'vitest';
import { toWebHandler } from '../server';
import { FormSchema } from '@xnok/emma-shared/types';
import { Env } from '../env';

// Mock types for Nitro bindings
interface MockD1Database {
  prepare: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
}

interface MockKVNamespace {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
}

const mockEnv: Env = {
  DB: {
    prepare: vi.fn(),
    batch: vi.fn(),
  } satisfies MockD1Database,
  submissionRepository: {
    saveSubmission: vi.fn(),
  },
  schemaRepository: {
    getSchema: vi.fn(),
  },
  CDN_URL: 'https://example.com',
  SCHEMA_CACHE: {
    get: vi.fn(),
    put: vi.fn(),
  } satisfies MockKVNamespace,
  ENVIRONMENT: 'test',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW: '60',
  MAX_SUBMISSION_SIZE: '10000',
  ALLOWED_ORIGINS: '*',
};

// Helper to create request with cloudflare context
function createRequestWithEnv(url: string, options: RequestInit = {}): Request {
  return new Request(url, options);
}

describe('API Worker', () => {
  it('should return health check status', async () => {
    const req = createRequestWithEnv('http://localhost/health', {
      method: 'GET',
    });

    const handler = toWebHandler();
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      environment: string;
    };
    expect(body.status).toBe('ok');
  });

  it('should handle form submission successfully', async () => {
    const formId = 'test-form';
    const submissionData = {
      data: { name: 'Test User', email: 'test@example.com' },
    };

    const mockFormSchema: FormSchema = {
      formId: formId,
      name: 'Test Form',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
      ],
      theme: 'default',
      version: '1',
      apiEndpoint: '',
      currentSnapshot: 1729089000,
    };

    // Mock the submission repository
    mockEnv.schemaRepository.getSchema = vi
      .fn()
      .mockResolvedValue(mockFormSchema);
    mockEnv.submissionRepository.saveSubmission = vi
      .fn()
      .mockResolvedValue(undefined);

    const req = createRequestWithEnv(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.168.1.1',
      },
      body: JSON.stringify(submissionData),
    });

    const handler = toWebHandler();
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      submissionId: string;
    };
    expect(body.success).toBe(true);
    expect(body.submissionId).toBeDefined();

    // Verify snapshot metadata was stored
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEnv.submissionRepository.saveSubmission).toHaveBeenCalledWith(
      expect.any(String),
      formId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { name: 'Test User', email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        timestamp: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ip: expect.any(String),
      }),
      1729089000,
      'test-form-1729089000.js'
    );
  });

  it('should return 404 if form not found', async () => {
    const formId = 'non-existent-form';
    const submissionData = {
      data: { name: 'Test User' },
    };

    // Mock the submission repository
    mockEnv.schemaRepository.getSchema = vi.fn().mockResolvedValue(null);

    const req = createRequestWithEnv(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const handler = toWebHandler();
    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid submission data', async () => {
    const formId = 'test-form';
    const submissionData = {
      data: { name: 'Test User' }, // Missing email
    };

    const mockFormSchema: FormSchema = {
      formId: formId,
      name: 'Test Form',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
      ],
      theme: 'default',
      version: '1',
      apiEndpoint: '',
    };

    // Mock the submission repository
    mockEnv.schemaRepository.getSchema = vi
      .fn()
      .mockResolvedValue(mockFormSchema);

    const req = createRequestWithEnv(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const handler = toWebHandler();
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it('should handle form submission without snapshot metadata', async () => {
    const formId = 'legacy-form';
    const submissionData = {
      data: { name: 'Test User', email: 'test@example.com' },
    };

    const mockFormSchema: FormSchema = {
      formId: formId,
      name: 'Legacy Form',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
      ],
      theme: 'default',
      version: '1',
      apiEndpoint: '',
      // No currentSnapshot defined - backward compatibility
    };

    mockEnv.schemaRepository.getSchema = vi
      .fn()
      .mockResolvedValue(mockFormSchema);
    mockEnv.submissionRepository.saveSubmission = vi
      .fn()
      .mockResolvedValue(undefined);

    const req = createRequestWithEnv(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const handler = toWebHandler();
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      submissionId: string;
    };
    expect(body.success).toBe(true);
    expect(body.submissionId).toBeDefined();

    // Verify submission was saved without snapshot metadata
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEnv.submissionRepository.saveSubmission).toHaveBeenCalledWith(
      expect.any(String),
      formId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { name: 'Test User', email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        timestamp: expect.any(String),
      }),
      undefined,
      undefined
    );
  });
});
