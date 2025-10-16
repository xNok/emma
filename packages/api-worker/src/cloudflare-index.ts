import app from './server';
import { D1SubmissionRepository } from './data/submission-repository';
import {
  CdnSchemaRepository,
  KvCacheSchemaRepository,
} from './data/schema-repository';
import { Env } from './env';

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    const cdnSchemaRepository = new CdnSchemaRepository(env.CDN_URL);
    env.submissionRepository = new D1SubmissionRepository(env.DB);
    env.schemaRepository = new KvCacheSchemaRepository(
      env.SCHEMA_CACHE,
      cdnSchemaRepository
    );
    return app.fetch(request, env, ctx);
  },
};
