import { Context } from 'hono';
import {
  FormSchema,
  SubmissionData,
  SubmissionResponse,
  FormRecord,
} from '@emma/shared/types';
import { validateSubmissionData } from '@emma/shared/schema';
import { generateSubmissionId, sanitizeInput } from '@emma/shared/utils';
import { Env } from '../types';
import { getFormSchema, saveSubmission } from '../database';

/**
 * Handles form submission
 */
export default async function handleSubmit(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  try {
    const formId = c.req.param('formId');
    if (!formId) {
      return c.json({ success: false, error: 'Form ID required' }, 400);
    }

    const submissionData = await c.req.json<SubmissionData>();
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';

    // Get form schema from database
    const formRecord = await getFormSchema(formId, c.env);
    if (!formRecord) {
      return c.json({ success: false, error: 'Form not found' }, 404);
    }

    const formSchema = JSON.parse(formRecord.schema) as FormSchema;

    // Validate submission data
    const validation = validateSubmissionData(submissionData.data, formSchema);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      return c.json(
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
        sanitizedData[key] = sanitizeInput(value as string);
      }
    });

    // Create submission record
    const submissionId = generateSubmissionId();

    const meta = {
      timestamp: submissionData.meta?.timestamp || new Date().toISOString(),
      userAgent:
        submissionData.meta?.userAgent || c.req.header('User-Agent'),
      referrer: submissionData.meta?.referrer || c.req.header('Referer'),
      ip: clientIP,
    };

    // Save submission to database
    await saveSubmission(submissionId, formId, sanitizedData, meta, c.env);

    // Return success
    const response: SubmissionResponse = {
      success: true,
      submissionId,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Submission error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
}

import { getFormSchema, saveSubmission } from '../database';