# Provider System Architecture

Date: 2025-01-10
Status: Final
Previous: [05-architectural-decisions.md](./05-architectural-decisions.md)

## 1. Overview

The Emma provider system is a pluggable architecture that allows different hosting platforms and services to be integrated with the Emma CLI. Providers are responsible for deploying forms, querying submissions, running migrations, and providing preview functionality.

## 2. Provider Types

### 2.1 Deployment Providers

Deploy form bundles and assets to hosting services. Examples:

- Cloudflare R2 (static hosting)
- AWS S3
- DigitalOcean Spaces
- Local filesystem (development)

### 2.2 Submission Providers

Query and retrieve form submission data. Examples:

- Cloudflare D1 (SQLite database)
- PostgreSQL
- MongoDB
- Local JSON files

### 2.3 Migration Providers

Handle database schema changes and data migrations.

### 2.4 Preview Providers

Provide local development preview functionality.

## 3. Provider Discovery

### 3.1 Package Naming Convention

Providers are distributed as npm packages following the naming pattern:

```
@xnok/emma-provider-<name>
```

Examples:

- `@xnok/emma-provider-cloudflare`
- `@xnok/emma-provider-aws`
- `@xnok/emma-provider-digitalocean`

### 3.2 Dynamic Loading

The CLI discovers providers by:

1. **Built-in Providers**: Listed in `BUILT_IN_PROVIDERS` constant
2. **Local Installation**: Scanning `node_modules/@xnok/` for provider packages
3. **Global Installation**: Checking CLI installation directory and parent directories

### 3.3 Provider Loading Patterns

Providers support multiple export patterns for maximum compatibility:

```typescript
// Pattern 1: Named export object
export const myProvider = {
  name: 'my-provider',
  description: 'My custom provider',
  // ... methods
};

// Pattern 2: Factory function
export function createMyProvider(FormManager) {
  return {
    name: 'my-provider',
    // ... provider definition
  };
}

// Pattern 3: Default export
export default createMyProvider;
```

## 4. Provider Interface

### 4.1 Core Interface

```typescript
interface DeploymentProviderDefinition<TCommand, TConfig> {
  name: string; // Unique provider identifier
  description: string; // Human-readable description
  capabilities: ProviderCapability[]; // What the provider can do

  // Optional methods
  register?(parent: TCommand, config: TConfig): void; // CLI command registration
  execute?(
    config: TConfig,
    formId: string,
    options: ProviderOptions
  ): Promise<void>; // Deployment
  init?(config: TConfig): Promise<{ success: boolean; message?: string }>; // Setup
  checkReadiness?(
    config: TConfig
  ): Promise<{ ready: boolean; issues?: string[] }>; // Health check
}
```

### 4.2 Provider Capabilities

```typescript
type ProviderCapability =
  | 'deploy' // Can deploy forms
  | 'submission-query' // Can query submissions
  | 'migrations' // Can run migrations
  | 'preview'; // Can provide previews
```

### 4.3 Provider Options

Generic options interface allowing arbitrary CLI flags:

```typescript
interface ProviderOptions {
  [key: string]: string | boolean | number | undefined;
}
```

## 5. Configuration Management

### 5.1 Provider-Specific Config

Each provider stores configuration under its name in the Emma config:

```json
{
  "cloudflare": {
    "bucket": "emma-forms",
    "publicUrl": "https://forms.example.com",
    "accountId": "1234567890"
  },
  "aws": {
    "bucket": "emma-forms",
    "region": "us-east-1"
  }
}
```

### 5.2 Environment Variables

Providers should prefer environment variables for sensitive data:

```bash
# Cloudflare
export CLOUDFLARE_API_TOKEN="..."
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."

# AWS
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

## 6. CLI Integration

### 6.1 Command Registration

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

### 6.2 Provider Selection

Users select providers via CLI commands:

```bash
# Deploy with specific provider
emma deploy my-form --target cloudflare --bucket my-bucket

# Initialize provider
emma init --provider cloudflare
```

## 7. Provider Lifecycle

### 7.1 Initialization (`init`)

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

### 7.2 Readiness Check (`checkReadiness`)

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

### 7.3 Execution (`execute`)

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

## 8. Error Handling

### 8.1 Provider Errors

Providers should handle errors gracefully and provide clear feedback:

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

### 8.2 Validation

Validate inputs and configuration before attempting operations:

```typescript
function validateOptions(options: ProviderOptions): void {
  if (!options.bucket) {
    throw new Error('--bucket is required');
  }
  if (!options.region) {
    throw new Error('--region is required');
  }
}
```

## 9. Testing

### 9.1 Provider Testing

Providers should include comprehensive tests:

```typescript
describe('MyProvider', () => {
  it('should deploy form successfully', async () => {
    // Mock dependencies
    // Test deployment logic
  });

  it('should handle deployment failures', async () => {
    // Test error scenarios
  });
});
```

### 9.2 Integration Testing

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

## 10. Best Practices

### 10.1 Provider Design

- **Idempotent Operations**: Deployments should be safe to run multiple times
- **Clear Error Messages**: Provide actionable error messages
- **Configuration Validation**: Validate config before attempting operations
- **Environment Awareness**: Support different environments (dev/staging/prod)

### 10.2 Package Structure

```
packages/provider-my-provider/
├── src/
│   ├── index.ts          # Main exports
│   ├── provider.ts       # Provider definition
│   ├── deploy.ts         # Deployment logic
│   ├── submission.ts     # Submission queries (if applicable)
│   └── types.ts          # TypeScript types
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 10.3 Documentation

- Include README with setup instructions
- Document all configuration options
- Provide examples for common use cases
- Document environment variable requirements

## 11. Future Enhancements

- Provider marketplace/registry
- Provider composition (combine multiple providers)
- Provider templates/scaffolding
- Provider performance monitoring
- Provider rollback capabilities</content>
  <parameter name="filePath">/workspaces/emma/docs/06-provider-system-architecture.md
