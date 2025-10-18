import { Context } from 'hono';
import { Env } from '../env';

/**
 * Lists submissions with optional filtering by form ID and snapshot
 */
export default async function handleListSubmissions(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  try {
    const formId = c.req.query('formId');
    const snapshotParam = c.req.query('snapshot');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    const snapshot = snapshotParam ? parseInt(snapshotParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Validate parameters
    if (snapshot !== undefined && isNaN(snapshot)) {
      return c.json(
        { success: false, error: 'Invalid snapshot parameter' },
        400
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return c.json(
        { success: false, error: 'Limit must be between 1 and 100' },
        400
      );
    }

    if (isNaN(offset) || offset < 0) {
      return c.json(
        { success: false, error: 'Offset must be non-negative' },
        400
      );
    }

    const submissionRepository = c.env.submissionRepository;
    const submissions = await submissionRepository.getSubmissions(
      formId,
      snapshot,
      limit,
      offset
    );

    // Group submissions by form ID and snapshot
    const grouped: Record<
      string,
      {
        formId: string;
        snapshots: Record<
          string,
          {
            snapshot: number | null;
            bundle: string | null;
            count: number;
            submissions: typeof submissions;
          }
        >;
      }
    > = {};

    submissions.forEach((submission) => {
      const fId = submission.form_id;
      const snapshotKey = submission.form_snapshot?.toString() || 'null';

      if (!grouped[fId]) {
        grouped[fId] = {
          formId: fId,
          snapshots: {},
        };
      }

      if (!grouped[fId].snapshots[snapshotKey]) {
        grouped[fId].snapshots[snapshotKey] = {
          snapshot: submission.form_snapshot ?? null,
          bundle: submission.form_bundle ?? null,
          count: 0,
          submissions: [],
        };
      }

      grouped[fId].snapshots[snapshotKey].count++;
      grouped[fId].snapshots[snapshotKey].submissions.push(submission);
    });

    return c.json({
      success: true,
      submissions,
      grouped,
      pagination: {
        limit,
        offset,
        count: submissions.length,
      },
    });
  } catch (error) {
    console.error('List submissions error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
}
