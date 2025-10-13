import { describe, it, expect } from 'vitest';
import worker from '../index';

function createMockEnv() {
  const statements: any[] = [];
  const DB = {
    prepare: (query: string) => {
      type Stmt = {
        _query: string;
        _values: unknown[];
        bind: (...values: unknown[]) => Stmt;
        first: <T = unknown>() => Promise<T | null>;
        run: <T = unknown>() => Promise<{ success: boolean; results?: T[] }>;
      };
      const st: Stmt = {
        _query: query,
        _values: [],
        bind(...values: unknown[]) {
          this._values = values;
          return this;
        },
        async first<T = unknown>() {
          // Return a fake form record when selecting from forms
          if (query.includes('FROM forms')) {
            return {
              id: 'contact-form-001',
              name: 'Contact Form',
              schema: JSON.stringify({
                formId: 'contact-form-001',
                name: 'Contact',
                version: '1',
                theme: 'default',
                apiEndpoint: '/submit/contact-form-001',
                fields: [
                  { id: 'name', type: 'text', label: 'Name', required: true },
                ],
              }),
              version: '1',
              api_endpoint: '/submit/contact-form-001',
              created_at: Date.now(),
              updated_at: Date.now(),
              active: 1,
              deploy_count: 0,
              submission_count: 0,
            } as unknown as T;
          }
          return null;
        },
        async run<T = unknown>() {
          statements.push({ query, values: this._values });
          return { success: true, results: [] as T[] };
        },
      };
      return st;
    },
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  };

  const env = {
    DB,
    ENVIRONMENT: 'test',
    RATE_LIMIT_REQUESTS: '5',
    RATE_LIMIT_WINDOW: '60',
    MAX_SUBMISSION_SIZE: '10000',
    ALLOWED_ORIGINS: '*',
  } as any;

  return { env, statements };
}

describe('API Worker', () => {
  it('submits a form successfully', async () => {
    const { env } = createMockEnv();
    const body = {
      formId: 'contact-form-001',
      data: { name: 'Jane' },
    };
    const req = new Request('https://example.com/submit/contact-form-001', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await worker.fetch(req, env, {
      waitUntil() {},
      passThroughOnException() {},
    } as any);

    expect(res.status).toBe(200);
  const json = (await res.json()) as { success: boolean; submissionId: string };
  expect(json.success).toBe(true);
  expect(typeof json.submissionId).toBe('string');
  });
});
