# Deployment Providers

This document describes the provider contract used by the Emma CLI and provides examples of provider implementations.

## Overview

Emma uses a pluggable provider system that allows different hosting platforms and services to be integrated with the CLI. For detailed information about the provider architecture, see [Provider System Architecture](../../docs/06-provider-system-architecture.md).

For information on creating custom providers, see [Creating Custom Providers](./creating-custom-providers.md).

## Provider Contract

A deployment provider implements the `DeploymentProviderDefinition` interface:

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

## Configuration Management

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

Use `config.get('provider-name')` and `config.set('provider-name', value)` for access.

## Available Providers

### Cloudflare R2

- **Purpose**: Upload built form bundle and theme CSS to Cloudflare R2 bucket
- **Capabilities**: `deploy`, `submission-query`, `migrations`
- **Package**: `@xnok/emma-provider-cloudflare`

#### Required Options

- `--bucket <name>`: R2 bucket name
- `--public-url <url>`: Base public URL that serves objects from the bucket

#### Optional Options

- `--account-id <id>` (or env: `CLOUDFLARE_ACCOUNT_ID`)
- `--api-token <token>` (or env: `CLOUDFLARE_API_TOKEN`)
- `--overwrite`: Overwrite existing objects

#### Environment Variables

```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
export R2_ACCESS_KEY_ID="your-access-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-access-key"
export R2_ACCOUNT_ID="your-cloudflare-account-id"
```

#### Init Flow

`emma init` offers Cloudflare provider setup:

- **Create bucket**: Prompts for accountId, apiToken, bucket, publicUrl, then creates the bucket via Wrangler
- **Use existing bucket**: Prompts for bucket, publicUrl, optional accountId

Configuration is saved under the `cloudflare` key.

#### Deployment Flow

1. Ensures the form is built
2. Resolves deployment options from CLI, config, and environment
3. Uploads bundle and theme CSS to R2
4. Prints bundle and theme URLs on success

### AWS S3

- **Purpose**: Upload built form bundle and theme CSS to AWS S3 bucket
- **Capabilities**: `deploy`
- **Package**: `@xnok/emma-provider-aws-s3`

#### Required Options

- `--bucket <name>`: S3 bucket name

#### Optional Options

- `--region <region>`: AWS region (defaults to us-east-1)
- `--access-key-id <id>` (or env: `AWS_ACCESS_KEY_ID`)
- `--secret-access-key <key>` (or env: `AWS_SECRET_ACCESS_KEY`)
- `--public-url <url>`: Custom public URL for the bucket
- `--overwrite`: Overwrite existing objects

#### Environment Variables

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

## Usage Examples

### Deploy with Cloudflare

```bash
# Deploy to Cloudflare R2
emma deploy my-form --target cloudflare --bucket my-forms-bucket --public-url https://forms.example.com

# Initialize Cloudflare provider
emma init --provider cloudflare
```

### Deploy with AWS S3

```bash
# Deploy to AWS S3
emma deploy my-form --target aws-s3 --bucket my-forms-bucket

# Initialize AWS S3 provider
emma init --provider aws-s3
```

## Creating Custom Providers

To create a custom provider for a new hosting platform:

1. Create a new package following the naming pattern `@xnok/emma-provider-<name>`
2. Implement the `DeploymentProviderDefinition` interface
3. Export the provider using one of the supported patterns
4. Add comprehensive tests
5. Document setup and usage instructions

See [Creating Custom Providers](./creating-custom-providers.md) for a complete guide with examples.

## Error Handling

Providers should handle errors gracefully and provide clear feedback:

- Validate configuration before attempting operations
- Use descriptive error messages
- Exit with `process.exit(1)` for unrecoverable errors
- Tests should mock exit calls

## Testing

Provider implementations should include:

- Unit tests for deployment logic
- Integration tests with the CLI
- Mock external API calls
- Error scenario testing

Example test structure:

```typescript
describe('MyProvider', () => {
  it('should deploy form successfully', async () => {
    // Test successful deployment
  });

  it('should handle deployment failures', async () => {
    // Test error scenarios
  });
});
```
