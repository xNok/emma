import { DatabaseBinding } from '../types/bindings';

export interface SubmissionRepository {
  saveSubmission(
    submissionId: string,
    formId: string,
    sanitizedData: Record<string, string | string[]>,
    meta: Record<string, unknown>,
    formSnapshot?: number,
    formBundle?: string
  ): Promise<void>;
}

export class MockSubmissionRepository implements SubmissionRepository {
  saveSubmission(
    submissionId: string,
    formId: string,
    data: Record<string, string | string[]>,
    meta: Record<string, unknown>,
    formSnapshot?: number,
    formBundle?: string
  ): Promise<void> {
    console.log('📨 Submission saved (mock):');
    console.log(`  ID: ${submissionId}`);
    console.log(`  Form: ${formId}`);
    console.log(`  Snapshot: ${formSnapshot || 'N/A'}`);
    console.log(`  Bundle: ${formBundle || 'N/A'}`);
    console.log(`  Data:`, data);
    console.log(`  Meta:`, meta);
    return Promise.resolve();
  }
}

export class D1SubmissionRepository implements SubmissionRepository {
  private db: DatabaseBinding;

  constructor(db: DatabaseBinding) {
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
}
