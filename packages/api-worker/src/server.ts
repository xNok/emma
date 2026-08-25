import {
  createApp,
  createRouter,
  defineEventHandler,
  setResponseHeader,
  getMethod,
  setResponseStatus,
  getHeader,
  toWebHandler as h3ToWebHandler,
} from 'h3';
import type { H3Event } from 'h3';
import handleSubmit from './handlers/submit';
import { DatabaseBinding, KVBinding } from './types/bindings';
import { SubmissionRepository } from './data/submission-repository';
import {
  SchemaRepository,
  CdnSchemaRepository,
  KvCacheSchemaRepository,
} from './data/schema-repository';

const app = createApp();
const router = createRouter();

// Define the structure of Cloudflare environment bindings
interface CloudflareEnv {
  DB: DatabaseBinding;
  SCHEMA_CACHE: KVBinding;
  CDN_URL?: string;
  ENVIRONMENT?: string;
  RATE_LIMIT_REQUESTS?: string;
  RATE_LIMIT_WINDOW?: string;
  MAX_SUBMISSION_SIZE?: string;
  ALLOWED_ORIGINS?: string;
}

// Define the structure of Nitro's cloudflare context
interface CloudflareContext {
  env: CloudflareEnv;
}

// Create a web handler with Nitro bindings support
export function toWebHandler() {
  return h3ToWebHandler(app);
}

// Repository implementations
import {
  D1SubmissionRepository,
  MockSubmissionRepository,
} from './data/submission-repository';
import { MockSchemaRepository } from './data/schema-repository';

// Middleware to initialize repositories from Nitro bindings or environment fallback
app.use(
  '/**',
  defineEventHandler((event) => {
    // Skip initialization if env is already set (for testing)
    if (event.context.env) {
      return;
    }

    // Access Cloudflare bindings through Nitro's event.context.cloudflare
    const cloudflare = event.context.cloudflare as
      | CloudflareContext
      | undefined;

    if (cloudflare?.env) {
      const env = cloudflare.env;

      // Initialize Cloudflare-specific repositories with Nitro bindings
      const cdnSchemaRepository = new CdnSchemaRepository(env.CDN_URL || '');
      const submissionRepository: SubmissionRepository =
        new D1SubmissionRepository(env.DB);
      const schemaRepository: SchemaRepository = new KvCacheSchemaRepository(
        env.SCHEMA_CACHE,
        cdnSchemaRepository
      );

      // Store repositories and env in event context for handlers
      event.context.env = {
        ...env,
        submissionRepository,
        schemaRepository,
      };
    } else {
      // Fallback for non-Cloudflare targets (e.g. Vercel, Node, AWS)
      // Provide mock/generic implementations for local development only.
      // In production non-Cloudflare environments without bindings, fail fast.
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'FATAL: Running in production without Cloudflare bindings or a generic repository factory configured. Form submissions cannot be saved persistently.'
        );
      }

      event.context.env = {
        ...(process.env as unknown as CloudflareEnv),
        submissionRepository: new MockSubmissionRepository(),
        schemaRepository: new MockSchemaRepository(),
      };
    }

    return;
  })
);

// CORS middleware with configurable origins
app.use(
  '/**',
  defineEventHandler((event: H3Event) => {
    // Read allowed origins from environment variable
    const env = event.context.env as
      | (CloudflareEnv & {
          submissionRepository?: SubmissionRepository;
          schemaRepository?: SchemaRepository;
        })
      | undefined;
    const allowedOriginsEnv: string =
      process.env.ALLOWED_ORIGINS || env?.ALLOWED_ORIGINS || '';

    let allowOrigin = '';
    const requestOrigin = getHeader(event, 'origin');

    if (allowedOriginsEnv === '*') {
      // Allow all origins (not recommended for production)
      allowOrigin = '*';
    } else if (allowedOriginsEnv && requestOrigin) {
      // Parse allowed origins from comma-separated list
      const allowedOrigins = allowedOriginsEnv
        .split(',')
        .map((origin: string) => origin.trim())
        .filter((origin: string) => origin.length > 0);

      // Check if request origin is in allowed list
      if (allowedOrigins.includes(requestOrigin)) {
        allowOrigin = requestOrigin;
      }
    }

    // Set CORS headers
    if (allowOrigin) {
      setResponseHeader(event, 'Access-Control-Allow-Origin', allowOrigin);
    }
    setResponseHeader(
      event,
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS'
    );
    setResponseHeader(
      event,
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    if (getMethod(event) === 'OPTIONS') {
      setResponseStatus(event, 200);
      return { status: 'ok' };
    }

    // Continue to next middleware
    return;
  })
);

// Routes
router.post(
  '/submit/:formId',
  defineEventHandler(async (event) => {
    return handleSubmit(event);
  })
);

router.get(
  '/health',
  defineEventHandler(() => {
    return {
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
    };
  })
);

// Mount router
app.use((event) => router.handler(event));

export default app;
