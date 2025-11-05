# API Worker Refactor to H3 + Multi-Provider Support

Date: 2025-11-05
Status: Completed
Previous: [34-documentation-consolidation.md](../34-documentation-consolidation.md)

## Summary

Successfully refactored the `api-worker` package from Hono to H3 framework with multi-provider support architecture. The refactor enables easier deployment across different cloud providers while maintaining the existing OpenAPI specification and functionality.

## Changes Made

### 1. Framework Migration
- **Replaced Hono with H3**: Migrated from Hono (Cloudflare-specific) to H3 (runtime-agnostic HTTP framework)
- **Updated dependencies**: Removed `hono` and `@hono/node-server`, added `h3`, `zod`
- **Maintained OpenAPI compatibility**: Kept `openapi-typescript` for type generation

### 2. Code Architecture
- **Server implementation** (`src/server.ts`): Converted to H3 app with universal middleware and routing
- **Handler updates** (`src/handlers/submit.ts`): Adapted to H3 event system instead of Hono context
- **Entry points**:
  - `src/cloudflare-index.ts`: Uses `toWebHandler` for Cloudflare Workers
  - `src/index.ts`: Uses `toNodeHandler` for Node.js development

### 3. Validation Enhancement
- **Added Zod schemas** (`src/validation.ts`): Created type-safe validation schemas based on OpenAPI spec
- **Request validation**: Integrated Zod validation in submit handler for runtime type checking

### 4. Build System
- **Multi-target builds**: Configured esbuild for different deployment targets
  - `yarn build:cloudflare`: Browser-compatible bundle for Cloudflare Workers
  - `yarn build:node`: Node.js compatible bundle
- **Development setup**: Added `tsx` for TypeScript execution in development

## Technical Decisions

### Why H3 over Hono?
- **Runtime agnostic**: H3 works across Node.js, Cloudflare, Deno, etc.
- **Better multi-provider support**: Enables the automatic bundling approach recommended
- **Unified API**: Single codebase deployable to multiple platforms

### Build Tool Choice
- **Nitro attempted but failed**: Initial attempt to use Nitro encountered build issues with native dependencies
- **Fallback to esbuild**: Maintained reliable builds with manual multi-target configuration
- **Future-ready**: Architecture supports easy migration to Nitro once stable

### Validation Strategy
- **Dual validation**: Maintained existing schema validation + added Zod for request structure
- **Type safety**: OpenAPI-generated types + runtime Zod validation
- **Error handling**: Structured error responses with field-level validation feedback

## Current Status

✅ **Working functionality**:
- Cloudflare Workers deployment (esbuild bundle)
- Node.js development server
- Form submission with validation
- Health check endpoint
- CORS middleware

✅ **Build system**:
- Successful builds for Cloudflare target
- TypeScript compilation passes
- Development server runs correctly

⚠️ **Known issues**:
- Test suite needs updates for H3 API changes
- Some TypeScript strict mode warnings in middleware

## Next Steps

1. **Update tests**: Migrate test cases from Hono to H3 API
2. **Add more providers**: Implement builds for DigitalOcean, AWS Lambda, etc.
3. **Consider Nitro migration**: Re-evaluate Nitro once stable version supports the requirements
4. **Performance testing**: Validate bundle sizes and runtime performance across providers

## Files Modified

- `package.json`: Dependencies and scripts
- `src/server.ts`: Main H3 application
- `src/handlers/submit.ts`: Request handling logic
- `src/cloudflare-index.ts`: Cloudflare entry point
- `src/index.ts`: Node.js development server
- `src/validation.ts`: Zod schemas (new)
- Tests: Need updates for H3 compatibility

## Links

- [API Worker Architecture](../04-api-worker-architecture.md)
- [Provider System Architecture](../06-provider-system-architecture.md)
- OpenAPI Spec: `packages/api-worker/openapi.yaml`