import { describe, it, expect, vi } from 'vitest';
import app from '../server';
import { FormSchema } from '@xnok/emma-shared/types';
import { Env } from '../env';
import { D1Database } from '@cloudflare/workers-types';
import { KVNamespace } from '@cloudflare/workers-types';

const mockEnv: Env = {
  DB: {
    prepare: vi.fn(),
    batch: vi.fn(),
  } as unknown as D1Database,
  submissionRepository: {
    saveSubmission: vi.fn(),
    getSubmissions: vi.fn(),
    getSubmissionsByFormId: vi.fn(),
  },
  schemaRepository: {
    getSchema: vi.fn(),
  },
  CDN_URL: 'https://example.com',
  SCHEMA_CACHE: {
    get: vi.fn(),
    put: vi.fn(),
  } as unknown as KVNamespace,
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

    // Verify snapshot metadata was stored
    expect(mockEnv.submissionRepository.saveSubmission).toHaveBeenCalledWith(
      expect.any(String),
      formId,
      { name: 'Test User', email: 'test@example.com' },
      expect.objectContaining({
        timestamp: expect.any(String),
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

    // Verify submission was saved without snapshot metadata
    expect(mockEnv.submissionRepository.saveSubmission).toHaveBeenCalledWith(
      expect.any(String),
      formId,
      { name: 'Test User', email: 'test@example.com' },
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
      undefined,
      undefined
    );
  });

  it('should list submissions with snapshot grouping', async () => {
    const mockSubmissions = [
      {
        id: 'sub_1',
        form_id: 'contact-form',
        data: JSON.stringify({ name: 'User 1', email: 'user1@test.com' }),
        meta: JSON.stringify({ timestamp: '2025-10-18T12:00:00Z' }),
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729260000,
        form_snapshot: 1729089000,
        form_bundle: 'contact-form-1729089000.js',
      },
      {
        id: 'sub_2',
        form_id: 'contact-form',
        data: JSON.stringify({ name: 'User 2', email: 'user2@test.com' }),
        meta: JSON.stringify({ timestamp: '2025-10-18T13:00:00Z' }),
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729263600,
        form_snapshot: 1729189000,
        form_bundle: 'contact-form-1729189000.js',
      },
      {
        id: 'sub_3',
        form_id: 'feedback-form',
        data: JSON.stringify({ feedback: 'Great!' }),
        meta: JSON.stringify({ timestamp: '2025-10-18T14:00:00Z' }),
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729267200,
        form_snapshot: 1729100000,
        form_bundle: 'feedback-form-1729100000.js',
      },
    ];

    mockEnv.submissionRepository.getSubmissions = vi
      .fn()
      .mockResolvedValue(mockSubmissions);

    const req = new Request('http://localhost/submissions', {
      method: 'GET',
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      submissions: typeof mockSubmissions;
      grouped: Record<string, unknown>;
      pagination: { limit: number; offset: number; count: number };
    };

    expect(body.success).toBe(true);
    expect(body.submissions).toHaveLength(3);
    expect(body.grouped).toHaveProperty('contact-form');
    expect(body.grouped).toHaveProperty('feedback-form');
    expect(body.pagination).toEqual({ limit: 50, offset: 0, count: 3 });

    // Verify grouping structure
    const contactFormGroup = body.grouped[
      'contact-form'
    ] as typeof body.grouped;
    expect(contactFormGroup).toHaveProperty('snapshots');
  });

  it('should filter submissions by form ID', async () => {
    const mockSubmissions = [
      {
        id: 'sub_1',
        form_id: 'contact-form',
        data: JSON.stringify({ name: 'User 1' }),
        meta: null,
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729260000,
        form_snapshot: 1729089000,
        form_bundle: 'contact-form-1729089000.js',
      },
    ];

    mockEnv.submissionRepository.getSubmissions = vi
      .fn()
      .mockResolvedValue(mockSubmissions);

    const req = new Request(
      'http://localhost/submissions?formId=contact-form',
      {
        method: 'GET',
      }
    );

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);

    // Verify repository was called with correct formId
    expect(mockEnv.submissionRepository.getSubmissions).toHaveBeenCalledWith(
      'contact-form',
      undefined,
      50,
      0
    );
  });

  it('should filter submissions by snapshot', async () => {
    const mockSubmissions = [
      {
        id: 'sub_1',
        form_id: 'contact-form',
        data: JSON.stringify({ name: 'User 1' }),
        meta: null,
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729260000,
        form_snapshot: 1729089000,
        form_bundle: 'contact-form-1729089000.js',
      },
    ];

    mockEnv.submissionRepository.getSubmissions = vi
      .fn()
      .mockResolvedValue(mockSubmissions);

    const req = new Request(
      'http://localhost/submissions?snapshot=1729089000',
      {
        method: 'GET',
      }
    );

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    // Verify repository was called with correct snapshot
    expect(mockEnv.submissionRepository.getSubmissions).toHaveBeenCalledWith(
      undefined,
      1729089000,
      50,
      0
    );
  });

  it('should validate pagination parameters', async () => {
    const req = new Request('http://localhost/submissions?limit=200', {
      method: 'GET',
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Limit must be between 1 and 100');
  });

  it('should export submissions as JSON with snapshot metadata', async () => {
    const mockSubmissions = [
      {
        id: 'sub_1',
        form_id: 'contact-form',
        data: JSON.stringify({ name: 'User 1', email: 'user1@test.com' }),
        meta: JSON.stringify({ timestamp: '2025-10-18T12:00:00Z' }),
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729260000,
        form_snapshot: 1729089000,
        form_bundle: 'contact-form-1729089000.js',
      },
      {
        id: 'sub_2',
        form_id: 'contact-form',
        data: JSON.stringify({
          name: 'User 2',
          email: 'user2@test.com',
          message: 'Hello',
        }),
        meta: JSON.stringify({ timestamp: '2025-10-18T13:00:00Z' }),
        spam_score: 0,
        status: 'read' as const,
        created_at: 1729263600,
        form_snapshot: 1729189000,
        form_bundle: 'contact-form-1729189000.js',
      },
    ];

    mockEnv.submissionRepository.getSubmissions = vi
      .fn()
      .mockResolvedValue(mockSubmissions);

    const req = new Request('http://localhost/submissions/export?format=json', {
      method: 'GET',
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Content-Disposition')).toMatch(
      /attachment; filename="submissions-.*\.json"/
    );

    const exportData = (await res.json()) as Array<{
      id: string;
      formId: string;
      data: Record<string, string>;
      snapshot: { timestamp: number; bundle: string };
    }>;
    expect(exportData).toHaveLength(2);
    expect(exportData[0]).toHaveProperty('snapshot');
    expect(exportData[0].snapshot.timestamp).toBe(1729089000);
    expect(exportData[0].snapshot.bundle).toBe('contact-form-1729089000.js');
  });

  it('should export submissions as CSV with snapshot columns', async () => {
    const mockSubmissions = [
      {
        id: 'sub_1',
        form_id: 'contact-form',
        data: JSON.stringify({ name: 'User 1', email: 'user1@test.com' }),
        meta: JSON.stringify({ timestamp: '2025-10-18T12:00:00Z' }),
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729260000,
        form_snapshot: 1729089000,
        form_bundle: 'contact-form-1729089000.js',
      },
    ];

    mockEnv.submissionRepository.getSubmissions = vi
      .fn()
      .mockResolvedValue(mockSubmissions);

    const req = new Request('http://localhost/submissions/export?format=csv', {
      method: 'GET',
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');
    expect(res.headers.get('Content-Disposition')).toMatch(
      /attachment; filename="submissions-.*\.csv"/
    );

    const csvContent = await res.text();
    expect(csvContent).toContain('form_snapshot');
    expect(csvContent).toContain('form_bundle');
    expect(csvContent).toContain('1729089000');
    expect(csvContent).toContain('contact-form-1729089000.js');
  });

  it('should handle CSV export with missing snapshot data', async () => {
    const mockSubmissions = [
      {
        id: 'sub_1',
        form_id: 'legacy-form',
        data: JSON.stringify({ name: 'User 1' }),
        meta: null,
        spam_score: 0,
        status: 'new' as const,
        created_at: 1729260000,
        form_snapshot: null,
        form_bundle: null,
      },
    ];

    mockEnv.submissionRepository.getSubmissions = vi
      .fn()
      .mockResolvedValue(mockSubmissions);

    const req = new Request('http://localhost/submissions/export?format=csv', {
      method: 'GET',
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    const csvContent = await res.text();
    expect(csvContent).toContain('N/A'); // Missing snapshot should show N/A
  });

  it('should validate export format parameter', async () => {
    const req = new Request(
      'http://localhost/submissions/export?format=xml',
      {
        method: 'GET',
      }
    );

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Format must be json or csv');
  });
});
