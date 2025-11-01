# @xnok/emma-provider-cloudflare

Cloudflare deployment and submission provider for Emma Forms.

## Features

- **Deployment**: Deploy forms to Cloudflare R2 storage
- **Submissions**: Query form submissions from Cloudflare D1 database
- **Workers**: Deploy and manage Cloudflare Workers API

## Installation

This provider is typically installed automatically by the Emma CLI when needed.

```bash
npm install @xnok/emma-provider-cloudflare
```

## Usage

### With Emma CLI

The provider is automatically discovered and can be used via the CLI:

```bash
# Deploy a form to Cloudflare R2
emma deploy cloudflare my-form

# Initialize Cloudflare provider setup
emma init --provider cloudflare
```

### Programmatic Usage

```typescript
import {
  cloudflareDeploymentProvider,
  cloudflareSubmissionProvider,
} from '@xnok/emma-provider-cloudflare';

// Use in your Emma configuration
```

## Configuration

The provider requires the following environment variables:

- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret access key
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_DATABASE_NAME` - D1 database name

## Capabilities

- `deploy` - Deploy forms to Cloudflare R2
- `submission-query` - Query submissions from D1
- `migrations` - Run database migrations

## Documentation

For detailed setup instructions, see:

- [Cloudflare Quickstart Guide](../../docs/developer-guide/cloudflare-quickstart.md)
- [Cloudflare Infrastructure](../../docs/infrastructure/cloudflare.md)

## License

MIT
