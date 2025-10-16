import app from './server';
import { D1SubmissionRepository } from './data/submission-repository';
import { Env } from './env';

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    env.submissionRepository = new D1SubmissionRepository(env.DB);
    return app.fetch(request, env, ctx);
  },
};
