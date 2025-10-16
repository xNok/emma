import { FormRecord } from '@emma/shared/types';
import { Env } from './types';

export async function getFormSchema(
  formId: string,
  env: Env
): Promise<FormRecord | null> {
  const result = await env.DB.prepare(
    `SELECT * FROM forms WHERE id = ? AND active = 1`
  )
    .bind(formId)
    .first<FormRecord>();

  return result || null;
}

export async function saveSubmission(
  submissionId: string,
  formId: string,
  sanitizedData: Record<string, string | string[]>,
  meta: Record<string, unknown>,
  env: Env
) {
  const timestamp = Math.floor(Date.now() / 1000);

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO submissions (id, form_id, data, meta, spam_score, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      submissionId,
      formId,
      JSON.stringify(sanitizedData),
      JSON.stringify(meta),
      0, // spam_score
      'new',
      timestamp
    ),
    env.DB.prepare(
      `UPDATE forms SET submission_count = submission_count + 1 WHERE id = ?`
    ).bind(formId),
  ]);
}