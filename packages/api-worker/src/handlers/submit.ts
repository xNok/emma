import type { H3Event } from 'h3';
import {
  readBody,
  getRouterParam,
  createError,
  getHeader,
  getRequestIP,
} from 'h3';
import { SubmissionResponse } from '@xnok/emma-shared/types';
import { validateSubmissionData } from '@xnok/emma-shared/schema';
import { generateSubmissionId, sanitizeInput } from '@xnok/emma-shared/utils';
import { Env } from '../env';
import { SubmissionRequestSchema } from '../validation';

/**
 * Handles form submission
 */
export default async function handleSubmit(
  event: H3Event
): Promise<
  SubmissionResponse | { success: false; error: string; field?: string }
> {
  try {
    const formId = getRouterParam(event, 'formId');
    if (!formId) {
      throw createError({ statusCode: 400, statusMessage: 'Form ID required' });
    }

    const body = await readBody(event);
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      });
    }

    // Validate request with Zod
    const validationResult = SubmissionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request format',
        data: { errors: validationResult.error.issues },
      });
    }

    const submissionData = validationResult.data;

    // Get client IP using provider-agnostic method
    const clientIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

    // Get repositories from event context (set up in cloudflare-index.ts)
    const env = event.context.env as Env;
    const submissionRepository = env.submissionRepository;
    const schemaRepository = env.schemaRepository;

    // Get form schema
    const formSchema = await schemaRepository.getSchema(formId);
    if (!formSchema) {
      throw createError({ statusCode: 404, statusMessage: 'Form not found' });
    }

    // Validate submission data
    const validation = validateSubmissionData(submissionData.data, formSchema);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      throw createError({
        statusCode: 400,
        statusMessage: firstError.message,
        data: { field: firstError.field },
      });
    }

    // Sanitize data
    const sanitizedData: Record<string, string | string[]> = {};
    Object.entries(submissionData.data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        sanitizedData[key] = value.map((v: string) => sanitizeInput(v));
      } else {
        sanitizedData[key] = sanitizeInput(String(value));
      }
    });

    // Create submission record
    const submissionId = generateSubmissionId();

    const meta = {
      timestamp: submissionData.meta?.timestamp || new Date().toISOString(),
      userAgent:
        submissionData.meta?.userAgent || getHeader(event, 'User-Agent'),
      referrer: submissionData.meta?.referrer || getHeader(event, 'Referer'),
      ip: clientIP,
    };

    // Extract snapshot information from the form schema
    const formSnapshot = formSchema.currentSnapshot;
    const formBundle = formSnapshot
      ? `${formId}-${formSnapshot}.js`
      : undefined;

    // Save submission to database
    await submissionRepository.saveSubmission(
      submissionId,
      formId,
      sanitizedData,
      meta,
      formSnapshot,
      formBundle
    );

    // Return success
    const response: SubmissionResponse = {
      success: true,
      submissionId,
    };

    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Submission error:', error);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.statusCode) {
      throw error; // Re-throw H3 errors
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
}
