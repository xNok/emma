import { Context } from 'hono';
import { Env } from '../env';
import { SubmissionRecord } from '@xnok/emma-shared/types';

/**
 * Exports submissions in CSV or JSON format with snapshot metadata
 */
export default async function handleExportSubmissions(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  try {
    const formId = c.req.query('formId');
    const format = c.req.query('format') || 'json';
    const snapshotParam = c.req.query('snapshot');

    const snapshot = snapshotParam ? parseInt(snapshotParam, 10) : undefined;

    // Validate format
    if (format !== 'json' && format !== 'csv') {
      return c.json(
        { success: false, error: 'Format must be json or csv' },
        400
      );
    }

    const submissionRepository = c.env.submissionRepository;
    const schemaRepository = c.env.schemaRepository;

    // Get submissions
    const submissions = await submissionRepository.getSubmissions(
      formId,
      snapshot,
      1000, // Max export limit
      0
    );

    if (format === 'json') {
      return exportAsJson(submissions);
    } else {
      return exportAsCsv(submissions, schemaRepository, c);
    }
  } catch (error) {
    console.error('Export submissions error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Export submissions as JSON with full metadata
 */
function exportAsJson(submissions: SubmissionRecord[]): Response {
  const exportData = submissions.map((submission) => ({
    id: submission.id,
    formId: submission.form_id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data: JSON.parse(submission.data),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    meta: submission.meta ? JSON.parse(submission.meta) : null,
    snapshot: {
      timestamp: submission.form_snapshot,
      bundle: submission.form_bundle,
    },
    spamScore: submission.spam_score,
    status: submission.status,
    createdAt: submission.created_at,
  }));

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="submissions-${Date.now()}.json"`,
    },
  });
}

/**
 * Export submissions as CSV with snapshot columns
 */
function exportAsCsv(
  submissions: SubmissionRecord[],
  _schemaRepository: { getSchema: (formId: string) => Promise<unknown> },
  c: Context<{ Bindings: Env }>
): Response {
  if (submissions.length === 0) {
    return c.json({ success: false, error: 'No submissions to export' }, 404);
  }

  // Collect all unique field names from all submissions
  const allFields = new Set<string>();
  submissions.forEach((submission) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(submission.data);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.keys(data).forEach((key) => allFields.add(key));
  });

  // Build CSV header with metadata and snapshot columns
  const headers = [
    'id',
    'form_id',
    'created_at',
    'status',
    'spam_score',
    'form_snapshot',
    'form_bundle',
    ...Array.from(allFields),
  ];

  // Build CSV rows
  const rows = submissions.map((submission) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(submission.data);
    const row: string[] = [
      submission.id,
      submission.form_id,
      new Date(submission.created_at * 1000).toISOString(),
      submission.status,
      submission.spam_score.toString(),
      submission.form_snapshot?.toString() || 'N/A',
      submission.form_bundle || 'N/A',
    ];

    // Add field values in order
    Array.from(allFields).forEach((field) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const value = data[field];
      if (value === undefined || value === null) {
        row.push('N/A');
      } else if (Array.isArray(value)) {
        row.push(value.join('; '));
      } else {
        row.push(String(value).replace(/"/g, '""')); // Escape quotes
      }
    });

    return row;
  });

  // Build CSV content
  const csvLines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ];

  const csvContent = csvLines.join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="submissions-${Date.now()}.csv"`,
    },
  });
}
