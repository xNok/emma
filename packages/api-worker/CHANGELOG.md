# @xnok/emma-api-worker

## 0.4.0

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

## 0.3.1

### Patch Changes

- Updated dependencies [569a105]
  - @xnok/emma-shared@0.4.0

## 0.3.0

### Minor Changes

- 5e5640b: Implement snapshot-aware submission storage with CLI viewer

  **New Features:**
  - Add `form_snapshot` and `form_bundle` fields to submission storage for tracking form versions
  - Implement `emma submissions list <form-id>` command for viewing submissions with snapshot grouping
  - Implement `emma submissions export <form-id>` command for exporting to JSON/CSV with snapshot metadata
  - Add provider abstraction for submission database access supporting multiple infrastructures

  **Security Architecture:**
  - Submission viewing restricted to authenticated CLI access (not exposed via public API)
  - Direct database access using provider credentials (Cloudflare D1 via wrangler)
  - No public API endpoints for viewing/exporting sensitive submission data

  **Provider System:**
  - Create `SubmissionProvider` interface for abstracted database operations
  - Implement `CloudflareD1Provider` with wrangler integration
  - Support for future database providers (PostgreSQL, MySQL, etc.)
  - Provider availability checking based on configuration

  **CLI Commands:**
  - `emma submissions list <form-id>` - View submissions grouped by snapshot
    - Filter by `--snapshot <timestamp>`, `--status`, `--limit`
    - Display submission previews with dates and status
  - `emma submissions export <form-id>` - Export submissions with complete snapshot metadata
    - Support `--format json|csv`
    - Include "N/A" for fields not present in submission's snapshot
    - Proper CSV escaping for all field values

  **Database:**
  - Migration `0002_add_submission_snapshot_fields.sql` adds snapshot columns
  - Automatic snapshot capture in submit handler
  - Backward compatible with NULL snapshot values for existing submissions

  **Documentation:**
  - Submission viewing guide with CLI usage examples
  - Export format specification for JSON and CSV
  - Form change strategies guide (when to edit vs. create new forms)

  **Testing:**
  - 94/94 tests passing including snapshot storage verification
  - Backward compatibility tests for submissions without snapshots

  **Breaking Changes:**
  None - all changes are additive and backward compatible. Public API remains unchanged with only the storage enhancement.

## 0.2.1

### Patch Changes

- Updated dependencies [2c8cb80]
  - @xnok/emma-shared@0.3.0

## 0.2.0

### Minor Changes

- a128405: Initial release of all packages.

### Patch Changes

- Updated dependencies [a128405]
  - @xnok/emma-shared@0.2.0
