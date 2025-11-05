import { toWebHandler } from 'h3'
import { D1SubmissionRepository } from './data/submission-repository';
import {
  CdnSchemaRepository,
  KvCacheSchemaRepository,
} from './data/schema-repository';
import { Env } from './env';
import app from './server';

// Set up repositories and create handler
const handler = toWebHandler(app)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Initialize repositories
    const cdnSchemaRepository = new CdnSchemaRepository(env.CDN_URL);
    env.submissionRepository = new D1SubmissionRepository(env.DB);
    env.schemaRepository = new KvCacheSchemaRepository(
      env.SCHEMA_CACHE,
      cdnSchemaRepository
    );

    // Set env in global context for H3
    (globalThis as any).env = env;

    // Handle the request
    return handler(request);
  }
};
