---
'@xnok/emma-api-worker': minor
'@xnok/emma-provider-cloudflare': minor
---

Migrate API worker to Nitro + H3 for multi-provider deployment support

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
