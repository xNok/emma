import { describe, it, expect, vi } from 'vitest';
import app from '../server';
import { FormRecord } from '@emma/shared/types';
import { Env } from '../types';

const mockEnv: Env = {
  DB: {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn(),
        run: vi.fn(),
      })),
      batch: vi.fn(() => Promise.resolve([])),
    })),
    batch: vi.fn(() => Promise.resolve([])),
  } as any,
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
    const body = await res.json();
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
    (mockEnv.DB.prepare as any).mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(mockFormRecord),
      batch: vi.fn().mockResolvedValue([]),
    });

    const req = new Request(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.submissionId).toBeDefined();
  });

  it('should return 404 if form not found', async () => {
    const formId = 'non-existent-form';
    const submissionData = {
      data: { name: 'Test User' },
    };

    // Mock the database response
    (mockEnv.DB.prepare as any).mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
    });

    const req = new Request(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(404);
    const body = await res.json();
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
    (mockEnv.DB.prepare as any).mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(mockFormRecord),
    });

    const req = new Request(`http://localhost/submit/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Email is required');
  });
});