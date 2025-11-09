import { SubmissionRepository } from './data/submission-repository';
import { SchemaRepository } from './data/schema-repository';
import { DatabaseBinding, KVBinding } from './types/bindings';

export interface Env {
  DB: DatabaseBinding;
  submissionRepository: SubmissionRepository;
  schemaRepository: SchemaRepository;
  CDN_URL: string;
  SCHEMA_CACHE: KVBinding;
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  MAX_SUBMISSION_SIZE: string;
  ALLOWED_ORIGINS: string;
}
