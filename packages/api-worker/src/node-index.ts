/**
 * Node.js entry point for api-worker
 * Used for local development and e2e testing
 */

import { createServer } from 'node:http';
import { toNodeListener, defineEventHandler } from 'h3';
import type { FormSchema } from '@xnok/emma-shared/types';
import app from './server.js';
import type { Env } from './env.js';

// Mock repositories for local development
class MockSubmissionRepository {
  saveSubmission(
    submissionId: string,
    formId: string,
    data: Record<string, string | string[]>,
    meta: Record<string, unknown>,
    formSnapshot?: number,
    formBundle?: string
  ): Promise<void> {
    console.log('📨 Submission saved (mock):');
    console.log(`  ID: ${submissionId}`);
    console.log(`  Form: ${formId}`);
    console.log(`  Snapshot: ${formSnapshot || 'N/A'}`);
    console.log(`  Bundle: ${formBundle || 'N/A'}`);
    console.log(`  Data:`, data);
    console.log(`  Meta:`, meta);
    return Promise.resolve();
  }
}

class MockSchemaRepository {
  getSchema(formId: string): Promise<FormSchema> {
    // Return a permissive schema for local testing
    console.log(`📋 Loading schema for form: ${formId} (mock)`);
    return Promise.resolve({
      formId,
      name: `Test Form ${formId}`,
      fields: [], // Accept any fields for testing
      theme: 'default',
      version: '1.0.0',
      apiEndpoint: `/api/submit/${formId}`,
      currentSnapshot: Date.now(),
    });
  }
}

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
