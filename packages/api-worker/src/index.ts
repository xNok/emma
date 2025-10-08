/**
 * Emma API Worker - Main Entry Point
 * Handles form submissions and stores them in D1
 */

import type {
  FormSchema,
  SubmissionData,
  SubmissionResponse,
  FormRecord,
} from '@emma/shared/types';
import { validateSubmissionData } from '@emma/shared/schema';
import { generateSubmissionId, sanitizeInput } from '@emma/shared/utils';

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  MAX_SUBMISSION_SIZE: string;
  ALLOWED_ORIGINS: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Routes
    if (path.startsWith('/submit/')) {
      return handleSubmit(request, env, ctx);
    }

    if (path === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', environment: env.ENVIRONMENT }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Handles form submission
 */
async function handleSubmit(
  request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response> {
  try {
    // Only accept POST
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    // Check rate limit
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitOk = checkRateLimit(clientIP, env);
    if (!rateLimitOk) {
      return jsonResponse(
        { success: false, error: 'Rate limit exceeded' },
        429
      );
    }

    // Parse form ID from URL
    const url = new URL(request.url);
    const formId = url.pathname.split('/').pop();
    if (!formId) {
      return jsonResponse({ success: false, error: 'Form ID required' }, 400);
    }

    // Parse request body
    const contentType = request.headers.get('Content-Type') || '';
    let submissionData: SubmissionData;

    if (contentType.includes('application/json')) {
      submissionData = (await request.json()) as SubmissionData;
    } else {
      return jsonResponse(
        { success: false, error: 'Content-Type must be application/json' },
        400
      );
    }

    // Validate form ID matches
    if (submissionData.formId !== formId) {
      return jsonResponse({ success: false, error: 'Form ID mismatch' }, 400);
    }

    // Check submission size
    const submissionSize = JSON.stringify(submissionData).length;
    const maxSize = parseInt(env.MAX_SUBMISSION_SIZE || '10000');
    if (submissionSize > maxSize) {
      return jsonResponse(
        { success: false, error: 'Submission too large' },
        413
      );
    }

    // Get form schema from database
    const formRecord = await getFormSchema(formId, env);
    if (!formRecord) {
      return jsonResponse({ success: false, error: 'Form not found' }, 404);
    }

    const formSchema = JSON.parse(formRecord.schema) as FormSchema;

    // Check honeypot
    if (formSchema.settings?.honeypot?.enabled) {
      const honeypotField = formSchema.settings.honeypot.fieldName;
      if (submissionData.data[honeypotField]) {
        // Silent success for bots
        return jsonResponse({
          success: true,
          submissionId: 'bot_' + Date.now(),
        });
      }
    }

    // Validate submission data
    const validation = validateSubmissionData(submissionData.data, formSchema);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      return jsonResponse(
        {
          success: false,
          error: firstError.message,
          field: firstError.field,
        },
        400
      );
    }

    // Sanitize data
    const sanitizedData: Record<string, string | string[]> = {};
    Object.entries(submissionData.data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        sanitizedData[key] = value.map((v: string) => sanitizeInput(v));
      } else {
        sanitizedData[key] = sanitizeInput(value);
      }
    });

    // Create submission record
    const submissionId = generateSubmissionId();
    const timestamp = Math.floor(Date.now() / 1000);

    const meta = {
      timestamp: submissionData.meta?.timestamp || new Date().toISOString(),
      userAgent:
        submissionData.meta?.userAgent || request.headers.get('User-Agent'),
      referrer: submissionData.meta?.referrer || request.headers.get('Referer'),
      ip: clientIP,
    };

    // Insert into database
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await env.DB.prepare(
      `INSERT INTO submissions (id, form_id, data, meta, spam_score, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .bind(
        submissionId,
        formId,
        JSON.stringify(sanitizedData),
        JSON.stringify(meta),
        0, // spam_score
        'new',
        timestamp
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .run();

    // Update submission count
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await env.DB.prepare(
      `UPDATE forms SET submission_count = submission_count + 1 WHERE id = ?`
    )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .bind(formId)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .run();

    // Return success
    const response: SubmissionResponse = {
      success: true,
      submissionId,
    };

    return jsonResponse(response, 200, env);
  } catch (error) {
    console.error('Submission error:', error);
    return jsonResponse(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Gets form schema from database
 */
async function getFormSchema(
  formId: string,
  env: Env
): Promise<FormRecord | null> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const result = await env.DB.prepare(
    `SELECT * FROM forms WHERE id = ? AND active = 1`
  )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    .bind(formId)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    .first<FormRecord>();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result || null;
}

/**
 * Simple rate limiting using cache API
 * In production, consider using Durable Objects for more sophisticated rate limiting
 */
function checkRateLimit(_ip: string, env: Env): boolean {
  const _limit = parseInt(env.RATE_LIMIT_REQUESTS || '5');
  const _window = parseInt(env.RATE_LIMIT_WINDOW || '60');

  // For now, return true (rate limiting not fully implemented)
  // In production, implement using KV or Durable Objects
  return true;
}

/**
 * Handles CORS preflight requests
 */
function handleCORS(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '*';
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];

  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(null, { status: 204, headers });
}

/**
 * Helper to create JSON responses with CORS headers
 */
function jsonResponse(data: unknown, status: number, env?: Env): Response {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (env) {
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
    if (allowedOrigins.includes('*')) {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return new Response(JSON.stringify(data), { status, headers });
}
