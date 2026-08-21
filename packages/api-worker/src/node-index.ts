/**
 * Node.js entry point for api-worker
 * Used for local development and e2e testing
 */

import { createServer } from 'node:http';
import { toNodeListener, defineEventHandler } from 'h3';
import app from './server.js';
import type { Env } from './env.js';

import { MockSubmissionRepository } from './data/submission-repository.js';
import { MockSchemaRepository } from './data/schema-repository.js';

// Create mock env
const mockEnv: Env = {
  submissionRepository: new MockSubmissionRepository(),
  schemaRepository: new MockSchemaRepository(),
  ALLOWED_ORIGINS: '*', // Allow all origins for local development
} as Env;

// Inject mock env using middleware (must be before app is converted to handler)
app.use(
  '/**',
  defineEventHandler((event) => {
    event.context.env = mockEnv;
    return;
  })
);

// Create Node.js listener
const handler = toNodeListener(app);

const server = createServer(handler);

const port = process.env.PORT || 3001;
const host = process.env.HOST || 'localhost';

server.listen(port, () => {
  console.log('');
  console.log('🚀 Emma API Worker (Node.js)');
  console.log(`   Server running at http://${host}:${port}`);
  console.log('');
  console.log('   Endpoints:');
  console.log(`   POST /submit/:formId - Submit form data`);
  console.log(`   GET  /health         - Health check`);
  console.log('');
  console.log('   💡 Using mock repositories for local development');
  console.log('');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { server, handler };
