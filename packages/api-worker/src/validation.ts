import { z } from 'zod';

// Submission request schema
export const SubmissionRequestSchema = z.object({
  data: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  meta: z
    .object({
      timestamp: z.string().datetime().optional(),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
    })
    .optional(),
});

// Submission success response schema
export const SubmissionSuccessResponseSchema = z.object({
  success: z.literal(true),
  submissionId: z.string(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  field: z.string().optional(),
});

// Union of possible responses
export const SubmissionResponseSchema = z.union([
  SubmissionSuccessResponseSchema,
  ErrorResponseSchema,
]);

// Type exports
export type SubmissionRequest = z.infer<typeof SubmissionRequestSchema>;
export type SubmissionSuccessResponse = z.infer<
  typeof SubmissionSuccessResponseSchema
>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
