# @xnok/emma-provider-cloudflare

## 0.3.0

### Minor Changes

- ae53c22: Migrate API worker to Nitro + H3 for multi-provider deployment support

  **API Worker Refactoring**
  - Migrated from Hono to H3 framework for runtime-agnostic deployment
  - Integrated Nitro for automatic provider-specific bundling
  - Replaced Wrangler CLI calls with direct Cloudflare API integration
  - Moved database migrations from provider-cloudflare to api-worker package
  - Added Zod v4 for request validation and type safety
  - Implemented custom H3 web handler with proper environment context injection
  - Enhanced CORS configuration with middleware approach
  - Improved client IP detection using CF-Connecting-IP header

  **Provider Cloudflare Updates**
  - Replaced Wrangler CLI deployment with direct Cloudflare Workers API
  - Enhanced init command error handling and configuration reuse
  - Improved deployment error messages and user feedback
  - Streamlined deployment process without external CLI dependencies

  **Architecture Benefits**
  - Runtime-agnostic server implementation supports multiple cloud providers
  - Automatic bundling for Cloudflare Workers, Node.js, AWS Lambda, and more
  - Reduced external dependencies and improved build reliability
  - Better separation of concerns between API worker and provider implementation
  - Enhanced security with proper environment context management

  This refactoring enables Emma to support multiple deployment providers while maintaining a single API worker codebase, improving maintainability and extensibility for future platform integrations.

## 0.2.0

### Minor Changes

- 569a105: Extract Cloudflare provider into standalone package with CLI discovery system

  **New Package: @xnok/emma-provider-cloudflare**
  - Extracted Cloudflare R2 deployment provider from form-builder
  - Extracted Cloudflare D1 submission provider from form-builder
  - Added provider manifest with capabilities declaration
  - Includes deployment to R2 and submission querying via D1

  **Enhanced Form Builder CLI**
  - Added `emma providers list` command to discover installed providers
  - Added `emma providers info <name>` command for provider details
  - Added `emma providers install <name>` command to install providers
  - Provider discovery supports local, global, and npx installations
  - Automatic provider detection with install prompts

  **Shared Types**
  - Added `ProviderManifest` interface for provider metadata
  - Added `ProviderCapability` type for capability declarations
  - Added `DeploymentProviderDefinition` and `SubmissionProviderDefinition` interfaces
  - Added `SubmissionQueryOptions` interface for querying submissions

  This change enables a pluggable provider architecture where deployment and submission providers can be independently developed, versioned, and distributed as separate packages.

### Patch Changes

- Updated dependencies [569a105]
  - @xnok/emma-shared@0.4.0
