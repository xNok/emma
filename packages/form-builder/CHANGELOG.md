# @xnok/emma-form-builder

## 0.6.0

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

- 95f47a7: Fix asset loading 404 errors in local deployment

  Forms deployed locally failed to load JavaScript bundles and CSS assets with 404 errors. The issue was caused by incorrect URL resolution when forms were served without trailing slashes. The browser treated `/forms/test-form-123` as a file rather than a directory, causing relative URLs to resolve incorrectly.

  **Changes:**
  - Added automatic redirect from `/forms/:formId` to `/forms/:formId/` for proper URL resolution
  - Enhanced asset serving route to detect trailing-slash-only requests and serve `index.html`
  - Updated form URLs in deployment results to include trailing slashes

  This fix ensures all form assets (JavaScript bundles, CSS files, ESM modules) load correctly in the browser during local development.

- Updated dependencies [569a105]
  - @xnok/emma-provider-cloudflare@0.2.0
  - @xnok/emma-shared@0.4.0
  - @xnok/emma-api-worker@0.3.1
  - @xnok/emma-form-renderer@0.2.2

## 0.5.0

### Minor Changes

- cdd26c4: Implement API worker deployment in `emma init` command
  - Add automatic API worker deployment as part of `emma init` with Cloudflare Wrangler integration
  - Create D1 database and run migrations automatically during initialization
  - Add environment variable validation (CLOUDFLARE_API_TOKEN, R2 credentials)
  - Bundle migrations in form-builder package for self-contained npm distribution
  - Add api-worker as dependency for seamless deployment from npm package
  - Provide interactive prompts with optional worker deployment
  - Add comprehensive error handling and recovery instructions
  - Update configuration schema to store database ID and worker URL

## 0.4.0

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

## 0.3.0

### Minor Changes

- 2c8cb80: Implement snapshot-based form versioning with edit and history commands

  **New Features:**
  - Add `emma edit <form-id>` command for interactive form editing with automatic snapshot creation
  - Add `emma history <form-id>` command to view complete snapshot timeline
  - Add `--snapshot <timestamp>` flag to `emma build` and `emma deploy` commands for building/deploying specific versions
  - Implement registry.json management in R2 for tracking forms and snapshots

  **Type System:**
  - Add `FormSnapshot` interface with timestamp, r2Key, changes, and deployed fields
  - Add `FormRegistry` and `FormRegistryEntry` interfaces for R2 storage tracking
  - Extend `FormSchema` with `createdAt`, `lastModified`, `currentSnapshot`, and `snapshots` array
  - Add `addedAt` timestamp field to `FormField` for tracking when fields were added
  - Extend `SubmissionRecord` with `form_snapshot` and `form_bundle` fields

  **Build & Deployment:**
  - Implement timestamp-based bundle naming: `<form-id>-<timestamp>.js`
  - Update FormBuilder to generate snapshot-specific bundles
  - Add registry management in Cloudflare deployment provider
  - Mark deployed snapshots automatically

  **Developer Experience:**
  - Extract FIELD_TYPES and THEMES to shared constants file
  - Add comprehensive test coverage for commands (85 tests passing)
  - Configure test coverage reporting with 70% thresholds
  - Add `test:coverage` script

  **Breaking Changes:**
  None - all changes are additive and backward compatible. Existing forms without snapshots will continue to work.

### Patch Changes

- Updated dependencies [2c8cb80]
  - @xnok/emma-shared@0.3.0
  - @xnok/emma-form-renderer@0.2.1

## 0.2.0

### Minor Changes

- a128405: Initial release of all packages.

### Patch Changes

- Updated dependencies [a128405]
  - @xnok/emma-form-renderer@0.2.0
  - @xnok/emma-shared@0.2.0
