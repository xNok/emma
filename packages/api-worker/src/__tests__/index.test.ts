import { describe, it, expect, vi } from 'vitest';
import app from '../server';
import { FormRecord } from '@emma/shared/types';
import { Env } from '../env';
import { D1Database } from '@cloudflare/workers-types';

const mockEnv: Env = {
  DB: {
    prepare: vi.fn(),
    batch: vi.fn(),
  } as unknown as D1Database,
  ENVIRONMENT: 'test',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW: '60',
  MAX_SUBMISSION_SIZE: '10000',
  ALLOWED_ORIGINS: '*',
};

describe('API Worker', () => {
  it('should return health check status', async () => {
    const res = await app.request('/health', {}, mockEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      environment: string;
    };
    expect(body.status).toBe('ok');
    expect(body.environment).toBe('test');
  });

  it('should handle form submission successfully', async () => {
    const formId = 'test-form';
    const submissionData = {
      data: { name: 'Test User', email: 'test@example.com' },
    };

    const mockFormRecord: FormRecord = {
      id: formId,
      name: 'Test Form',
      schema: JSON.stringify({
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true },
        ],
      }),
      active: 1,
      submission_count: 0,
      created_at: '',
      updated_at: '',
    };

    // Mock the database response
    const prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(mockFormRecord),
    });
    vi.mocked(mockEnv.DB).prepare = prepareMock;

    const req = new Request(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      submissionId: string;
    };
    expect(body.success).toBe(true);
    expect(body.submissionId).toBeDefined();
  });

  it('should return 404 if form not found', async () => {
    const formId = 'non-existent-form';
    const submissionData = {
      data: { name: 'Test User' },
    };

    // Mock the database response
    const prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
    });
    vi.mocked(mockEnv.DB).prepare = prepareMock;

    const req = new Request(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Form not found');
  });

  it('should return 400 for invalid submission data', async () => {
    const formId = 'test-form';
    const submissionData = {
      data: { name: 'Test User' }, // Missing email
    };

    const mockFormRecord: FormRecord = {
      id: formId,
      name: 'Test Form',
      schema: JSON.stringify({
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true },
        ],
      }),
      active: 1,
      submission_count: 0,
      created_at: '',
      updated_at: '',
    };

    // Mock the database response
    const prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(mockFormRecord),
    });
    vi.mocked(mockEnv.DB).prepare = prepareMock;

    const req = new Request(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Email is required');
  });
});
