import { SubmissionRepository } from './data/submission-repository';
import { SchemaRepository } from './data/schema-repository';

export interface Env {
  DB: any; // Nitro binding
  submissionRepository: SubmissionRepository;
  schemaRepository: SchemaRepository;
  CDN_URL: string;
  SCHEMA_CACHE: any; // Nitro binding
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  MAX_SUBMISSION_SIZE: string;
  ALLOWED_ORIGINS: string;
}
