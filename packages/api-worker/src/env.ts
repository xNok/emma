import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  MAX_SUBMISSION_SIZE: string;
  ALLOWED_ORIGINS: string;
}
