import { toWebHandler } from 'h3'
import { D1SubmissionRepository } from './data/submission-repository';
import {
  CdnSchemaRepository,
  KvCacheSchemaRepository,
} from './data/schema-repository';
import { Env } from './env';
import app from './server';

// Create the H3 web handler
const handler = toWebHandler(app)

/**
 * Cloudflare Workers entry point
 * This handler initializes the environment and repositories for each request
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Initialize repositories with Cloudflare bindings
    const cdnSchemaRepository = new CdnSchemaRepository(env.CDN_URL || '');
    const submissionRepository = new D1SubmissionRepository(env.DB);
    const schemaRepository = new KvCacheSchemaRepository(
      env.SCHEMA_CACHE,
      cdnSchemaRepository
    );

    // Create a new request with env attached for H3 to access
    const modifiedRequest = new Request(request);
    
    // Store env on the request object so we can access it in middleware
    (modifiedRequest as any).__env = {
      ...env,
      submissionRepository,
      schemaRepository,
    };

    // Handle the request
    const response = await handler(modifiedRequest);
    
    return response;
  }
};
