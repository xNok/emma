# @xnok/emma-form-builder

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
