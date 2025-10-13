# Emma API Worker

Cloudflare Worker that handles form submissions and stores data in D1. Routes are defined by the OpenAPI spec (`openapi.yaml`) and dispatched via `openapi-backend`.

## Overview

The API Worker provides:

- Form submission endpoint (`/submit/:formId`)
- Data validation against form schemas
- Spam detection (honeypot)
- Rate limiting
- Database persistence

## Run & Deploy

Monorepo uses Yarn workspaces.

```bash
yarn install
yarn workspace @emma/api-worker dev   # local dev with wrangler
yarn workspace @emma/api-worker deploy
```

## Configuration

Create `wrangler.toml`:

```toml
name = "emma-api"
main = "src/index.ts"
compatibility_date = "2025-10-07"

[[d1_databases]]
binding = "DB"
database_name = "emma-submissions"
database_id = "your-database-id"

[vars]
ALLOWED_ORIGINS = "*"
MAX_SUBMISSION_SIZE = "10000"
# Set to require header X-API-Key; leave empty for public API
API_KEY = ""
```

## API Endpoints

### POST /submit/:formId

Submit form data.

**Request:**

```json
{
  "formId": "contact-form-001",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response:**

```json
{
  "success": true,
  "submissionId": "sub_abc123"
}
```

## Development
See docs: `docs/developer-guide/cloudflare-quickstart.md` for detailed instructions.

## Documentation

See [/docs/infrastructure/cloudflare.md](../../docs/infrastructure/cloudflare.md) for infrastructure setup.
