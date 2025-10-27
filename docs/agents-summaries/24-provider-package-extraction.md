# Provider Package Extraction and Discovery System

**Date:** October 27, 2025  
**Agent:** GitHub Copilot  
**Task:** Extract Cloudflare provider into standalone package and implement provider discovery/install UX

## Summary

Successfully extracted the Cloudflare deployment and submission provider code into a standalone `@emma/provider-cloudflare` package and implemented a complete provider discovery and management system in the CLI.

## Changes Implemented

### 1. New Package: `@emma/provider-cloudflare`

Created a new monorepo package at `packages/provider-cloudflare/` with:

- **Deployment Provider** (`src/deploy.ts`): CloudflareR2Deployment class for deploying forms to R2
- **Submission Provider** (`src/submission.ts`): cloudflareD1Provider for querying D1 submissions
- **Provider Manifest** (`src/index.ts`): Metadata describing the provider's capabilities
- **Tests** (`src/__tests__/provider.test.ts`): Basic provider functionality tests
- **Documentation** (`README.md`): Installation and usage guide

### 2. Shared Provider Types

Added to `shared/types/index.ts`:

```typescript
// Provider capabilities
export type ProviderCapability = 
  | 'deploy' 
  | 'submission-query' 
  | 'migrations' 
  | 'preview';

// Provider manifest
export interface ProviderManifest {
  name: string;
  displayName: string;
  description: string;
  packageName: string;
  version?: string;
  capabilities: ProviderCapability[];
  isAvailable?: () => Promise<boolean>;
}

// Deployment provider definition
export interface DeploymentProviderDefinition { ... }

// Submission provider definition
export interface SubmissionProviderDefinition { ... }

// Query options
export interface SubmissionQueryOptions { ... }
```

### 3. CLI Provider Commands

Created `packages/form-builder/src/commands/providers.ts` with three subcommands:

#### `emma providers list [--available]`
- Discovers installed providers from `node_modules/@emma/provider-*`
- Shows provider status (configured or not)
- Lists capabilities for each provider
- Optionally shows available (not yet installed) providers

#### `emma providers info <provider-name>`
- Shows detailed information about a specific provider
- Displays package name, version, capabilities
- Indicates configuration status
- Provides next steps if not configured

#### `emma providers install <provider-name> [--npm]`
- Installs a provider package using yarn or npm
- Prompts user to configure after installation
- Validates against known provider registry

#### Helper: `ensureProviderAvailable()`
- Checks if a required provider is installed and configured
- Prompts user to install if missing
- Used by commands that depend on specific providers

### 4. Bridge Files in form-builder

Updated `packages/form-builder/src/deployment/cloudflare.ts` to:
- Import from `@emma/provider-cloudflare`
- Maintain backward compatibility
- Keep CLI registration logic

Updated `packages/form-builder/src/submission-providers/cloudflare.ts` to:
- Re-export from `@emma/provider-cloudflare`
- Maintain backward compatibility

### 5. Documentation

Updated `docs/developer-guide/cli-reference.md` with:
- Complete provider management commands reference
- Usage examples for each command
- Provider capabilities explanation
- Guide for creating custom providers

## Technical Details

### Provider Discovery

The system discovers providers by:
1. Scanning `node_modules/@emma/` for packages starting with `provider-`
2. Loading each package's `package.json`
3. Importing the main entry point
4. Reading the `ProviderManifest` from default export or `.manifest` property
5. Checking availability using the `isAvailable()` method

### Package Structure

```
packages/provider-cloudflare/
├── package.json          # Package metadata
├── tsconfig.json         # TypeScript config
├── vitest.config.ts      # Test config
├── README.md             # Documentation
└── src/
    ├── index.ts          # Main export with manifest
    ├── deploy.ts         # R2 deployment implementation
    ├── submission.ts     # D1 submission provider
    └── __tests__/
        └── provider.test.ts  # Tests
```

### Design Decisions

1. **Monorepo Package**: Keep provider in the same repo for now, easy to extract later
2. **Workspace Protocol**: Use `workspace:*` for internal dependencies
3. **Bridge Pattern**: Keep old imports working while using new package internally
4. **Dynamic Import**: Use dynamic imports to load provider modules at runtime
5. **Capability-Based**: Providers declare capabilities, CLI can filter by needs

## Testing

All existing tests pass (96 tests):
- Updated cloudflare deployment tests to import from new package
- Added basic provider manifest tests
- Added CLI provider command tests

## Benefits

1. **Modularity**: Providers are self-contained, independently versioned
2. **Discoverability**: Users can list and install providers easily
3. **Extensibility**: Easy to add new providers (DigitalOcean, S3, etc.)
4. **Clarity**: Clear separation between core CLI and providers
5. **Testability**: Providers can be tested independently

## Future Work

- Add more providers (DigitalOcean Spaces, AWS S3, custom)
- Implement provider registry/marketplace
- Add provider templates/scaffolding command
- Support provider plugins for other capabilities
- Add provider health checks and diagnostics

## Files Changed

### New Files
- `packages/provider-cloudflare/package.json`
- `packages/provider-cloudflare/tsconfig.json`
- `packages/provider-cloudflare/vitest.config.ts`
- `packages/provider-cloudflare/README.md`
- `packages/provider-cloudflare/src/index.ts`
- `packages/provider-cloudflare/src/deploy.ts`
- `packages/provider-cloudflare/src/submission.ts`
- `packages/provider-cloudflare/src/__tests__/provider.test.ts`
- `packages/form-builder/src/commands/providers.ts`
- `packages/form-builder/src/__tests__/providers.test.ts`

### Modified Files
- `shared/types/index.ts` - Added provider types
- `packages/form-builder/package.json` - Added provider dependency
- `packages/form-builder/src/cli.ts` - Registered provider command
- `packages/form-builder/src/deployment/cloudflare.ts` - Bridge to new package
- `packages/form-builder/src/submission-providers/cloudflare.ts` - Bridge to new package
- `packages/form-builder/src/submission-providers/index.ts` - Updated types
- `packages/form-builder/src/__tests__/cloudflare-deployment.test.ts` - Updated imports
- `packages/form-builder/src/__tests__/deployment/cloudflare.test.ts` - Updated imports
- `docs/developer-guide/cli-reference.md` - Added provider commands documentation

## Commands to Test

```bash
# List installed providers
emma providers list

# List all available providers
emma providers list --available

# Show provider info
emma providers info cloudflare

# Install a provider
emma providers install cloudflare

# Use provider alias
emma provider list
```
