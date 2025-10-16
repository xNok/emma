import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { SubmissionRepository } from './data/submission-repository';
import { SchemaRepository } from './data/schema-repository';

export interface Env {
  DB: D1Database;
  submissionRepository: SubmissionRepository;
  schemaRepository: SchemaRepository;
  CDN_URL: string;
  SCHEMA_CACHE: KVNamespace;
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  MAX_SUBMISSION_SIZE: string;
  ALLOWED_ORIGINS: string;
}
