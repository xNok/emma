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
import type { Env, RequestWithEnv } from './env';

const app = createApp();
const router = createRouter();

// Temporary storage for current request env (used to pass env through H3's web handler)
let currentRequestEnv: Env | undefined;

// Create a web handler that properly extracts env from RequestWithEnv
export function toWebHandler() {
  const baseHandler = h3ToWebHandler(app);
  
  return async (request: Request): Promise<Response> => {
    // Extract env from RequestWithEnv before calling the handler
    const reqWithEnv = request as RequestWithEnv;
    
    // Store env in module scope temporarily so middleware can access it
    if (reqWithEnv.__env) {
      currentRequestEnv = reqWithEnv.__env;
    }
    
    const response = await baseHandler(request);
    
    // Clean up
    currentRequestEnv = undefined;
    
    return response;
  };
}

// Middleware to inject env from temporary storage into event context
app.use(
  '/**',
  defineEventHandler((event) => {
    if (currentRequestEnv) {
      event.context.env = currentRequestEnv;
    }
    return;
  })
);

// CORS middleware with configurable origins
app.use(
  '/**',
  defineEventHandler((event: H3Event) => {
    // Read allowed origins from environment variable
    const env = event.context.env as Env | undefined;
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
