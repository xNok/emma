import {
  createApp,
  createRouter,
  defineEventHandler,
  setResponseHeader,
  getMethod,
  setResponseStatus,
  getHeader,
} from 'h3';
import handleSubmit from './handlers/submit';

const app = createApp();
const router = createRouter();

// Middleware to extract env from request (set by cloudflare-index or tests)
app.use(
  '/**',
  defineEventHandler((event) => {
    // Get env from request if available
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const request = event.node?.req as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (request?.__env) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      event.context.env = request.__env;
    }
    // Continue to next middleware
    return;
  })
);

// CORS middleware with configurable origins
app.use(
  '/**',
  defineEventHandler((event) => {
    // Read allowed origins from environment variable
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const env = event.context.env as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
// eslint-disable-next-line @typescript-eslint/unbound-method
app.use(router.handler);

export default app;
