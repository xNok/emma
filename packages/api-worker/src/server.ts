import { createApp, createRouter, defineEventHandler, setResponseHeader, getMethod, setResponseStatus, getHeader } from 'h3'
import handleSubmit from './handlers/submit'

const app = createApp()
const router = createRouter()

// Middleware to extract env from request (set by cloudflare-index or tests)
app.use('/**', defineEventHandler((event) => {
  // Get env from request if available
  const request = event.node.req as any;
  if (request.__env) {
    event.context.env = request.__env;
  }
}))

// CORS middleware with configurable origins
app.use('/**', defineEventHandler((event) => {
  // Read allowed origins from environment variable
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || event.context.env?.ALLOWED_ORIGINS || '';
  
  let allowOrigin = '';
  const requestOrigin = getHeader(event, 'origin');
  
  if (allowedOriginsEnv === '*') {
    // Allow all origins (not recommended for production)
    allowOrigin = '*';
  } else if (allowedOriginsEnv && requestOrigin) {
    // Parse allowed origins from comma-separated list
    const allowedOrigins = allowedOriginsEnv
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    
    // Check if request origin is in allowed list
    if (allowedOrigins.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    }
  }
  
  // Set CORS headers
  if (allowOrigin) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', allowOrigin);
  }
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 200)
    return { status: 'ok' }
  }
}))

// Routes
router.post('/submit/:formId', defineEventHandler(async (event) => {
  return handleSubmit(event)
}))

router.get('/health', defineEventHandler(() => {
  return {
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
  }
}))

// Mount router
app.use(router)

export default app
