import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import handleSubmit from './handlers/submit';
import handleListSubmissions from './handlers/list-submissions';
import handleExportSubmissions from './handlers/export-submissions';
import { Env } from './env';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.post('/submit/:formId', handleSubmit);
app.get('/submissions', handleListSubmissions);
app.get('/submissions/export', handleExportSubmissions);

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
  });
});

export default app;
