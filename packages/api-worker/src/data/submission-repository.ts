import { D1Database } from '@cloudflare/workers-types';

export interface SubmissionRepository {
  saveSubmission(
    submissionId: string,
    formId: string,
    sanitizedData: Record<string, string | string[]>,
    meta: Record<string, unknown>
  ): Promise<void>;
}

export class D1SubmissionRepository implements SubmissionRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async saveSubmission(
    submissionId: string,
    formId: string,
    sanitizedData: Record<string, string | string[]>,
    meta: Record<string, unknown>
  ): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);

    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO submissions (id, form_id, data, meta, spam_score, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          submissionId,
          formId,
          JSON.stringify(sanitizedData),
          JSON.stringify(meta),
          0, // spam_score
          'new',
          timestamp
        ),
      this.db
        .prepare(
          `UPDATE forms SET submission_count = submission_count + 1 WHERE id = ?`
        )
        .bind(formId),
    ]);
  }
}
