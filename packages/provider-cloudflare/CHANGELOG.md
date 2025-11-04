# @xnok/emma-provider-cloudflare

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
