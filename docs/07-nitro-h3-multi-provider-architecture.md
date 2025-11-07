# Nitro + H3 Multi-Provider Architecture

Date: 2025-11-05
Status: Implemented
Previous: [06-provider-system-architecture.md](./06-provider-system-architecture.md)

## 1. Overview

This document describes the architectural decision to use Nitro as the build tool and H3 as the web framework for the Emma API worker. This approach enables seamless multi-provider deployment while maintaining a single codebase.

## 2. Background

### 2.1 The Multi-Provider Challenge

Emma needs to deploy to multiple hosting providers with different runtime requirements:

- **Cloudflare Workers**: V8 isolates, no Node.js APIs, requires ES modules
- **DigitalOcean Functions**: Node.js runtime
- **AWS Lambda**: Node.js runtime with specific handler format
- **Vercel Edge**: V8 runtime similar to Cloudflare
- **Self-hosted**: Standard Node.js server

Traditional approaches require either:

1. Maintaining separate codebases for each provider
2. Complex bundler configurations for each target
3. Limiting deployment options to a single provider

### 2.2 Why Not Just Use Hono or Express?

While frameworks like Hono and Express work well, they don't solve the build/deployment problem:

- **Express**: Node.js specific, doesn't work in V8 isolates (Cloudflare Workers)
- **Hono**: Works across runtimes but requires manual bundling for each target
- **Manual bundling**: Complex, error-prone, requires maintaining multiple build configs

## 3. The Nitro + H3 Solution

### 3.1 Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                   OpenAPI Specification                  │
│                    (openapi.yaml)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Type Generation (openapi-typescript)        │
│                  + Validation (Zod v4)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   H3 Application                         │
│              (Universal HTTP Framework)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Routes: /submit/:formId, /health                 │  │
│  │  Handlers: submit.ts, health check                │  │
│  │  Middleware: CORS, error handling                 │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Nitro Build Tool                        │
│         (Single source → Multiple targets)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  nitro build --preset cloudflare                  │  │
│  │  nitro build --preset node-server                 │  │
│  │  nitro build --preset aws-lambda                  │  │
│  │  nitro build --preset vercel-edge                 │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┼──────────┬──────────┐
          ▼          ▼          ▼          ▼
    ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
    │Cloudflare│ │ Node.js│ │  AWS   │ │ Vercel  │
    │ Workers │ │ Server │ │ Lambda │ │  Edge   │
    └─────────┘ └────────┘ └────────┘ └─────────┘
```

### 3.2 Component Responsibilities

#### H3 - Universal HTTP Framework

- **Purpose**: Runtime-agnostic HTTP handling
- **Features**:
  - Works in Node.js, Deno, Cloudflare Workers, Bun
  - Minimal API surface (similar to Express/Hono)
  - Native Web API support (Request/Response)
  - Composable middleware system
- **File**: `src/server.ts`

#### Nitro - Universal Build Tool

- **Purpose**: Automatic bundling for any provider
- **Features**:
  - Pre-configured presets for 20+ providers
  - Automatic code splitting and optimization
  - Environment-specific builds
  - Zero-config for most use cases
- **File**: `nitro.config.ts`

#### Provider-Specific Entry Points

- **Cloudflare**: `src/cloudflare-index.ts` - Sets up D1/KV bindings
- **Node.js**: `src/index.ts` - Standard HTTP server
- **Future**: Can add AWS, Vercel, etc. as needed

## 4. Implementation Details

### 4.1 Project Structure

```
packages/api-worker/
├── nitro.config.ts          # Nitro configuration
├── openapi.yaml             # API specification (source of truth)
├── src/
│   ├── server.ts            # H3 app (universal)
│   ├── cloudflare-index.ts  # Cloudflare Worker entry point
│   ├── index.ts             # Node.js entry point
│   ├── handlers/
│   │   └── submit.ts        # Route handlers
│   ├── data/
│   │   ├── submission-repository.ts
│   │   └── schema-repository.ts
│   ├── validation.ts        # Zod schemas
│   ├── types.ts            # Generated from OpenAPI
│   └── env.ts              # Environment types
├── .output/                 # Nitro build output
│   └── server/
│       └── index.mjs        # Bundled worker (auto-generated)
└── wrangler.toml           # Cloudflare deployment config
```

### 4.2 Build Process

```bash
# Build for Cloudflare Workers
yarn build:cloudflare
# → Outputs to .output/server/index.mjs (ESM, optimized for V8)

# Build for Node.js server
yarn build:node
# → Outputs to .output/server/index.mjs (CJS, Node.js optimized)

# Build for AWS Lambda (future)
nitro build --preset aws-lambda
# → Outputs AWS Lambda handler

# Build for Vercel Edge (future)
nitro build --preset vercel-edge
# → Outputs Vercel Edge handler
```

### 4.3 Nitro Configuration

```typescript
// nitro.config.ts
export default defineNitroConfig({
  srcDir: 'src',
  preset: 'cloudflare-worker',
  compatibilityDate: '2025-11-05',
  entry: './cloudflare-index.ts',

  cloudflare: {
    d1Databases: { DB: process.env.D1_DATABASE_ID },
    kvNamespaces: { SCHEMA_CACHE: process.env.KV_NAMESPACE_ID },
  },
});
```

### 4.4 H3 Application

```typescript
// src/server.ts
import { createApp, defineEventHandler } from 'h3';
import handleSubmit from './handlers/submit';

const app = createApp();

// Universal middleware (works everywhere)
app.use(
  '/**',
  defineEventHandler((event) => {
    // CORS, logging, etc.
  })
);

// Routes
app.use('/submit/:formId', defineEventHandler(handleSubmit));

export default app;
```

### 4.5 Provider-Specific Setup

```typescript
// src/cloudflare-index.ts
import { toWebHandler } from 'h3';
import app from './server';

const handler = toWebHandler(app);

export default {
  async fetch(request, env, ctx) {
    // Set up Cloudflare-specific context (D1, KV)
    const event = extractH3Event(request);
    event.context.env = {
      ...env,
      submissionRepository: new D1SubmissionRepository(env.DB),
      schemaRepository: new KvCacheSchemaRepository(env.SCHEMA_CACHE),
    };

    return handler(request);
  },
};
```

## 5. Security Improvements

### 5.1 CORS Configuration

```typescript
// Configurable CORS instead of wildcard
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';

if (allowedOriginsEnv === '*') {
  allowOrigin = '*'; // Development only
} else {
  // Production: validate against whitelist
  const allowedOrigins = allowedOriginsEnv.split(',').map((o) => o.trim());
  if (allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }
}
```

### 5.2 Client IP Extraction

```typescript
// Cloudflare-specific header for real IP
const clientIP = getHeader(event, 'CF-Connecting-IP') || 'unknown';
```

### 5.3 Request Validation

```typescript
// Zod v4 for strong type-safe validation
const validationResult = SubmissionRequestSchema.safeParse(body);
if (!validationResult.success) {
  throw createError({
    statusCode: 400,
    data: { errors: validationResult.error.issues },
  });
}
```

## 6. Testing Strategy

### 6.1 Unit Tests

- Handler-level tests (submit, health)
- Repository tests (D1, KV)
- Validation tests (Zod schemas)

### 6.2 Integration Tests

- H3 app tests with mocked environment
- Cloudflare Worker simulation
- End-to-end request/response tests

### 6.3 Provider Tests

- Cloudflare provider deployment tests
- API worker deployment verification
- Migration idempotency tests

### 6.4 Test Files

```
src/__tests__/
├── server.test.ts           # H3 app tests
├── submit.test.ts           # Submit handler tests
├── cloudflare-index.test.ts # Cloudflare integration
└── validation.test.ts       # Zod schema tests

packages/provider-cloudflare/src/__tests__/
├── provider.test.ts         # Provider CLI tests
└── api-worker-deployment.test.ts  # Deployment tests
```

## 7. Adding New Providers

### 7.1 Steps to Add a New Provider

1. **Create Provider Entry Point**

   ```typescript
   // src/digitalocean-index.ts
   import { toNodeListener } from 'h3';
   import app from './server';

   export default toNodeListener(app);
   ```

2. **Add Nitro Preset**

   ```bash
   nitro build --preset digitalocean
   ```

3. **Configure Provider-Specific Resources**

   ```typescript
   // src/digitalocean-index.ts
   event.context.env = {
     submissionRepository: new PostgresSubmissionRepository(),
     schemaRepository: new RedisSchemaRepository(),
   };
   ```

4. **Add Build Script**

   ```json
   {
     "scripts": {
       "build:digitalocean": "nitro build --preset digitalocean"
     }
   }
   ```

5. **Create Provider Package**
   ```
   packages/provider-digitalocean/
   ├── src/
   │   └── provider.ts    # Deployment logic
   └── package.json
   ```

### 7.2 Supported Nitro Presets

Nitro comes with 20+ presets out of the box:

- **Serverless**: AWS Lambda, Vercel, Netlify, Cloudflare Pages
- **Edge**: Cloudflare Workers, Vercel Edge, Deno Deploy
- **Traditional**: Node.js, Bun, Deno
- **Platforms**: DigitalOcean, Render, Railway

See: https://nitro.build/deploy

## 8. Deployment Workflow

### 8.1 Cloudflare Workers Deployment

```bash
# 1. Build the worker with Nitro
cd packages/api-worker
yarn build:cloudflare

# 2. Deploy via provider CLI
cd ../form-builder
emma init --provider cloudflare

# Or deploy directly
cd packages/api-worker
yarn deploy
```

### 8.2 Provider Package Integration

The `provider-cloudflare` package:

1. Builds the api-worker using Nitro
2. Creates/configures D1 database
3. Runs migrations
4. Deploys worker script to Cloudflare
5. Returns deployment URL

```typescript
// packages/provider-cloudflare/src/api-worker.ts
const scriptPath = path.join(
  this.apiWorkerPath,
  '.output/server/index.mjs' // Nitro output
);

await fetch(`https://api.cloudflare.com/.../workers/scripts/${workerName}`, {
  method: 'PUT',
  body: await fs.readFile(scriptPath),
});
```

## 9. Migration Path

### 9.1 From Previous Architecture

**Before** (esbuild manual bundling):

- Separate build configs for each target
- Manual Worker binding setup
- Custom bundler configuration
- Hono-specific adapters

**After** (Nitro + H3):

- Single `nitro.config.ts`
- Automatic Worker binding detection
- Zero-config builds for most providers
- Universal H3 handlers

### 9.2 Breaking Changes

- Build output moved from `dist/index.js` to `.output/server/index.mjs`
- Wrangler config updated to use new output path
- Provider deployment scripts updated
- Test mocks updated for H3 context pattern

## 10. Performance Characteristics

### 10.1 Bundle Sizes

- **Cloudflare Worker**: ~95 KB (26.9 KB gzipped)
- **Node.js**: Similar, with additional Node.js stdlib polyfills removed

### 10.2 Cold Start Times

- **Cloudflare Workers**: <10ms (V8 isolates)
- **AWS Lambda**: 100-200ms (Node.js runtime)
- **Node.js Server**: N/A (persistent process)

### 10.3 Build Times

- Initial build: ~5-10 seconds
- Incremental build: ~1-2 seconds (with caching)

## 11. Limitations and Trade-offs

### 11.1 Current Limitations

1. **Nitro Learning Curve**: Team needs to learn Nitro-specific patterns
2. **Build Output Size**: Slightly larger than minimal esbuild bundles
3. **Debugging**: Build output is minified (use source maps)

### 11.2 Trade-offs Made

| Aspect           | Trade-off           | Rationale                           |
| ---------------- | ------------------- | ----------------------------------- |
| Bundle size      | +10-20 KB           | Worth it for multi-provider support |
| Build complexity | More abstraction    | Simplifies long-term maintenance    |
| Flexibility      | Opinionated presets | Reduces configuration burden        |

## 12. Future Enhancements

### 12.1 Short Term

- [ ] Add source maps for debugging
- [ ] Implement Nitro dev mode with hot reload
- [ ] Add performance monitoring
- [ ] Create provider templates

### 12.2 Long Term

- [ ] Add AWS Lambda support
- [ ] Add DigitalOcean Functions support
- [ ] Add Vercel Edge support
- [ ] Create provider marketplace
- [ ] Add A/B testing for multi-provider deployments

## 13. References

- [Nitro Documentation](https://nitro.build)
- [H3 Documentation](https://h3.unjs.io)
- [OpenAPI TypeScript](https://github.com/drwpow/openapi-typescript)
- [Zod v4](https://zod.dev)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## 14. Related Documents

- [04-api-worker-architecture.md](./04-api-worker-architecture.md) - Previous architecture
- [06-provider-system-architecture.md](./06-provider-system-architecture.md) - Provider system
- [05-architectural-decisions.md](./05-architectural-decisions.md) - Other ADRs
