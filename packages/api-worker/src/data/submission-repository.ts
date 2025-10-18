import { D1Database } from '@cloudflare/workers-types';
import { SubmissionRecord } from '@xnok/emma-shared/types';

export interface SubmissionRepository {
  saveSubmission(
    submissionId: string,
    formId: string,
    sanitizedData: Record<string, string | string[]>,
    meta: Record<string, unknown>,
    formSnapshot?: number,
    formBundle?: string
  ): Promise<void>;
  getSubmissions(
    formId?: string,
    snapshot?: number,
    limit?: number,
    offset?: number
  ): Promise<SubmissionRecord[]>;
  getSubmissionsByFormId(formId: string): Promise<SubmissionRecord[]>;
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
    meta: Record<string, unknown>,
    formSnapshot?: number,
    formBundle?: string
  ): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);

    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO submissions (id, form_id, data, meta, spam_score, status, created_at, form_snapshot, form_bundle)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          submissionId,
          formId,
          JSON.stringify(sanitizedData),
          JSON.stringify(meta),
          0, // spam_score
          'new',
          timestamp,
          formSnapshot ?? null,
          formBundle ?? null
        ),
      this.db
        .prepare(
          `UPDATE forms SET submission_count = submission_count + 1 WHERE id = ?`
        )
        .bind(formId),
    ]);
  }

  async getSubmissions(
    formId?: string,
    snapshot?: number,
    limit = 50,
    offset = 0
  ): Promise<SubmissionRecord[]> {
    let query = `
      SELECT id, form_id, data, meta, spam_score, status, created_at, form_snapshot, form_bundle
      FROM submissions
      WHERE 1=1
    `;
    const bindings: (string | number)[] = [];

    if (formId) {
      query += ` AND form_id = ?`;
      bindings.push(formId);
    }

    if (snapshot !== undefined) {
      query += ` AND form_snapshot = ?`;
      bindings.push(snapshot);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const result = await this.db.prepare(query).bind(...bindings).all();
    return (result.results || []) as SubmissionRecord[];
  }

  async getSubmissionsByFormId(formId: string): Promise<SubmissionRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT id, form_id, data, meta, spam_score, status, created_at, form_snapshot, form_bundle
         FROM submissions
         WHERE form_id = ?
         ORDER BY created_at DESC`
      )
      .bind(formId)
      .all();
    return (result.results || []) as SubmissionRecord[];
  }
}
