# Emma API Worker

Cloudflare Worker that handles form submissions and stores data in D1.

## Overview

The API Worker provides:
- Form submission endpoint (`/submit/:formId`)
- Data validation against form schemas
- Spam detection (honeypot)
- Rate limiting
- Database persistence

## Deployment

```bash
npm install
npx wrangler deploy
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

```bash
npm run dev
npx wrangler dev
```

## Documentation

See [/docs/infrastructure/cloudflare.md](../../docs/infrastructure/cloudflare.md) for infrastructure setup.
