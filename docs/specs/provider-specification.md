# Emma Provider Specification

**Version:** 1.0
**Date:** November 4, 2025
**Status:** Active

## Overview

This document defines the contract for Emma deployment and submission providers. Providers are pluggable modules that extend Emma's functionality to support different hosting platforms and data storage systems.

## Provider Types

### Deployment Providers

Responsible for deploying form bundles and assets to hosting services.

**Interface:** `DeploymentProviderDefinition<TCommand, TConfig>`

**Capabilities:** `'deploy'`

### Submission Providers

Responsible for querying and retrieving form submission data.

**Interface:** `SubmissionProviderDefinition`

**Capabilities:** `'submission-query'`

### Migration Providers

Responsible for database schema changes and data migrations.

**Interface:** `MigrationProviderDefinition`

**Capabilities:** `'migrations'`

### Preview Providers

Responsible for local development preview functionality.

**Interface:** `PreviewProviderDefinition`

**Capabilities:** `'preview'`

## Provider Discovery

### Package Naming Convention

Providers must be published as npm packages following the pattern:

```
@xnok/emma-provider-<name>
```

**Examples:**

- `@xnok/emma-provider-cloudflare`
- `@xnok/emma-provider-aws-s3`
- `@xnok/emma-provider-digitalocean`

### Dynamic Loading

The CLI discovers providers through:

1. **Built-in Providers**: Listed in `BUILT_IN_PROVIDERS` array
2. **Local Installation**: Scanning `node_modules/@xnok/` directory
3. **Global Installation**: Checking CLI installation paths

### Export Patterns

Providers must support at least one of the following export patterns:

#### Pattern 1: Named Export Object

```typescript
export const myProvider = {
  name: 'my-provider',
  description: 'My Provider',
  capabilities: ['deploy'],
  register: (parent, config) => {
    /* ... */
  },
  execute: async (config, formId, options) => {
    /* ... */
  },
};
```

#### Pattern 2: Factory Function

```typescript
export function createMyProvider(FormManager) {
  return {
    name: 'my-provider',
    description: 'My Provider',
    // ... provider definition
  };
}
```

#### Pattern 3: Default Export

```typescript
export default {
  name: 'my-provider',
  description: 'My Provider',
  // ... provider definition
};
```

## Provider Interface Specification

### Core Provider Properties

All providers must implement:

```typescript
interface BaseProviderDefinition {
  name: string; // Unique identifier (kebab-case)
  description: string; // Human-readable description
  capabilities: ProviderCapability[]; // What the provider can do
}
```

### Provider Capabilities

```typescript
type ProviderCapability =
  | 'deploy' // Can deploy forms to hosting services
  | 'submission-query' // Can query form submissions
  | 'migrations' // Can run database migrations
  | 'preview'; // Can provide preview functionality
```

### Deployment Provider Interface

```typescript
interface DeploymentProviderDefinition<TCommand, TConfig>
  extends BaseProviderDefinition {
  capabilities: ['deploy', ...ProviderCapability[]];

  // CLI command registration (optional)
  register?: (parent: TCommand, config: TConfig) => void;

  // Form deployment (optional)
  execute?: (
    config: TConfig,
    formId: string,
    options: ProviderOptions
  ) => Promise<void>;

  // Provider setup/initialization (optional)
  init?: (config: TConfig) => Promise<{ success: boolean; message?: string }>;

  // Health/readiness check (optional)
  checkReadiness?: (
    config: TConfig
  ) => Promise<{ ready: boolean; issues?: string[] }>;
}
```

### Submission Provider Interface

```typescript
interface SubmissionProviderDefinition extends BaseProviderDefinition {
  capabilities: ['submission-query', ...ProviderCapability[]];

  // Query submissions (optional)
  querySubmissions?: (
    options: SubmissionQueryOptions
  ) => Promise<SubmissionRecord[]>;

  // Check if provider is available (optional)
  isAvailable?: () => Promise<boolean>;
}
```

## Configuration Management

### Provider-Specific Configuration

Each provider stores configuration under its name in the Emma config:

```json
{
  "cloudflare": {
    "bucket": "emma-forms",
    "publicUrl": "https://forms.example.com",
    "accountId": "1234567890"
  },
  "aws-s3": {
    "bucket": "emma-forms",
    "region": "us-east-1"
  }
}
```

### Config Interface

Providers receive a config object implementing:

```typescript
interface ProviderConfigInterface {
  isInitialized(): boolean;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  save(): Promise<void>;
}
```

### Environment Variables

Providers should prefer environment variables for sensitive data:

```bash
# AWS Provider
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."

# Cloudflare Provider
export CLOUDFLARE_API_TOKEN="..."
export R2_ACCESS_KEY_ID="..."
```

## CLI Integration

### Command Registration

Providers register CLI commands through the `register` method:

```typescript
register(parent: Command, config: EmmaConfig) {
  parent
    .command('my-provider')
    .description('Deploy to My Provider')
    .argument('<form-id>', 'Form ID to deploy')
    .option('--bucket <name>', 'Storage bucket name')
    .option('--region <region>', 'Deployment region')
    .action(async (formId, options) => {
      await this.execute(config, formId, options);
    });
}
```

### Provider Selection

Users select providers via CLI commands:

```bash
# Deploy with specific provider
emma deploy my-form --target cloudflare --bucket my-bucket

# Initialize provider
emma init --provider cloudflare
```

## Provider Lifecycle

### Initialization (`init`)

Sets up provider infrastructure and captures configuration:

```typescript
async init(config: EmmaConfig): Promise<{ success: boolean; message?: string }> {
  // Interactive setup
  const bucket = await prompt('Enter bucket name:');
  config.set('my-provider', { bucket });

  // Create infrastructure (buckets, databases, etc.)
  await createInfrastructure();

  return { success: true, message: 'Provider initialized successfully' };
}
```

**Requirements:**

- Return `{ success: boolean, message?: string }`
- Store configuration under provider name
- Handle errors gracefully
- Provide clear user feedback

### Readiness Check (`checkReadiness`)

Validates provider configuration and connectivity:

```typescript
async checkReadiness(config: EmmaConfig): Promise<{ ready: boolean; issues?: string[] }> {
  const issues: string[] = [];

  if (!config.get('my-provider.bucket')) {
    issues.push('Bucket not configured');
  }

  if (!process.env.MY_PROVIDER_API_KEY) {
    issues.push('API key not set in environment');
  }

  return { ready: issues.length === 0, issues };
}
```

**Requirements:**

- Return `{ ready: boolean, issues?: string[] }`
- Check configuration completeness
- Validate environment variables
- Test connectivity when possible

### Execution (`execute`)

Performs the actual deployment or query operation:

```typescript
async execute(config: EmmaConfig, formId: string, options: ProviderOptions): Promise<void> {
  // Ensure form is built
  await formManager.ensureBuilt(formId);

  // Deploy artifacts
  const result = await deployToProvider(formId, options);

  // Output results
  console.log(`Form deployed: ${result.url}`);
}
```

**Requirements:**

- Handle form building if needed
- Process provider-specific options
- Provide clear success/error feedback
- Use appropriate exit codes for CLI

## Error Handling

### Provider Errors

Providers must handle errors gracefully:

```typescript
try {
  await deployToProvider(formId, options);
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    console.error('Invalid API credentials. Check your environment variables.');
    process.exit(1);
  }
  throw error;
}
```

### Error Categories

- **Configuration Errors**: Missing or invalid config
- **Authentication Errors**: Invalid credentials
- **Network Errors**: Connectivity issues
- **Resource Errors**: Missing buckets, databases, etc.
- **Quota Errors**: Rate limits, storage limits

### Exit Codes

- `0`: Success
- `1`: General error (invalid arguments, missing files)
- `2`: Authentication/authorization error
- `3`: Network/connectivity error
- `4`: Resource not found
- `5`: Quota/limit exceeded

## Package Structure

Providers should follow this package structure:

```
packages/provider-my-provider/
├── src/
│   ├── index.ts          # Main exports and manifest
│   ├── provider.ts       # Provider definition
│   ├── deploy.ts         # Deployment logic (if applicable)
│   ├── submission.ts     # Submission queries (if applicable)
│   ├── types.ts          # TypeScript types
│   └── __tests__/        # Test files
│       ├── provider.test.ts
│       └── integration.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Testing Requirements

### Unit Tests

Providers must include comprehensive unit tests:

```typescript
describe('MyProvider', () => {
  it('should have correct provider definition', () => {
    const provider = createMyProvider();
    expect(provider.name).toBe('my-provider');
    expect(provider.capabilities).toContain('deploy');
  });

  it('should deploy successfully', async () => {
    // Mock dependencies
    // Test deployment logic
    // Verify results
  });

  it('should handle deployment failures', async () => {
    // Test error scenarios
    // Verify error handling
  });
});
```

### Integration Tests

Test provider integration with the CLI:

```typescript
describe('CLI Integration', () => {
  it('should register provider commands', () => {
    // Test CLI command registration
  });

  it('should execute provider deployment', () => {
    // Test full deployment flow
  });
});
```

### Test Coverage

- Provider definition and registration
- Configuration management
- Successful operations
- Error scenarios
- CLI integration
- Environment variable handling

## Provider Manifest

Each provider package must export a manifest:

```typescript
export const myProviderManifest: ProviderManifest = {
  name: 'my-provider',
  displayName: 'My Provider',
  description: 'Deploy forms to My Platform',
  packageName: '@xnok/emma-provider-my-provider',
  version: '1.0.0',
  capabilities: ['deploy'],
  async isAvailable() {
    // Check if provider can be used
    return !!process.env.MY_PROVIDER_API_KEY;
  },
};
```

## Versioning

### Semantic Versioning

Providers follow semantic versioning:

- **MAJOR**: Breaking changes to interface or behavior
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Compatibility

- Providers must maintain backward compatibility within major versions
- Breaking changes require major version bump
- CLI will warn about provider version mismatches

## Security Requirements

### Credential Handling

- Never store credentials in config files
- Use environment variables for sensitive data
- Implement proper credential validation
- Clear error messages without exposing secrets

### Data Protection

- Encrypt sensitive data in transit
- Validate SSL/TLS certificates
- Implement proper access controls
- Follow principle of least privilege

## Performance Requirements

### Deployment Time

- Initial deployment: < 30 seconds
- Incremental deployment: < 10 seconds
- Large forms: < 60 seconds

### Query Performance

- Submission queries: < 5 seconds
- Paginated results: < 2 seconds per page
- Real-time queries: < 1 second

### Resource Usage

- Memory usage: < 100MB during operations
- Network requests: Minimize API calls
- Error recovery: Implement exponential backoff

## Future Extensions

### Provider Composition

Support combining multiple providers:

```typescript
const compositeProvider = composeProviders([
  cloudflareProvider,
  awsProvider,
  localProvider,
]);
```

### Provider Marketplace

Registry for community providers with:

- Provider ratings and reviews
- Automated compatibility testing
- Security scanning
- Documentation validation

### Advanced Capabilities

Future capability types:

- `'cdn'`: Content delivery network integration
- `'analytics'`: Form analytics and reporting
- `'backup'`: Automated backup and recovery
- `'monitoring'`: Performance monitoring and alerting</content>
  <parameter name="filePath">/workspaces/emma/docs/specs/provider-specification.md
