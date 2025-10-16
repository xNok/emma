import { Context } from 'hono';
import { SubmissionData, SubmissionResponse } from '@emma/shared/types';
import { validateSubmissionData } from '@emma/shared/schema';
import { generateSubmissionId, sanitizeInput } from '@emma/shared/utils';
import { Env } from '../env';
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
    const submissionRepository = c.env.submissionRepository;
    const schemaRepository = c.env.schemaRepository;

    // Get form schema
    const formSchema = await schemaRepository.getSchema(formId);
    if (!formSchema) {
      return c.json({ success: false, error: 'Form not found' }, 404);
    }

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
        sanitizedData[key] = sanitizeInput(String(value));
      }
    });

    // Create submission record
    const submissionId = generateSubmissionId();

    const meta = {
      timestamp: submissionData.meta?.timestamp || new Date().toISOString(),
      userAgent: submissionData.meta?.userAgent || c.req.header('User-Agent'),
      referrer: submissionData.meta?.referrer || c.req.header('Referer'),
      ip: clientIP,
    };

    // Save submission to database
    await submissionRepository.saveSubmission(
      submissionId,
      formId,
      sanitizedData,
      meta
    );

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
