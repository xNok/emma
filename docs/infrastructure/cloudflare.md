# Cloudflare Infrastructure Setup

**Related Documents:**
- [00-mvp-embeddable-forms.md](../00-mvp-embeddable-forms.md)
- [02-technical-architecture.md](../02-technical-architecture.md)

## 1. Overview

Emma uses Cloudflare's edge computing platform for hosting, data storage, and API services. This provides global distribution, automatic scaling, and minimal operational overhead.

### Services Used

| Service | Purpose | Pricing Tier |
|---------|---------|-------------|
| Cloudflare R2 | Store static form JS bundles | Free tier (10GB storage) |
| Cloudflare Workers | API endpoint for submissions | Free tier (100k requests/day) |
| Cloudflare D1 | SQLite database for submissions | Free tier (5GB storage) |
| Cloudflare Pages | Optional: Host form builder dashboard | Free tier |

## 2. Prerequisites

### 2.1 Cloudflare Account Setup

1. Create a Cloudflare account at https://dash.cloudflare.com/sign-up
2. Add payment method (required even for free tier)
3. Enable Workers and Pages in your account
4. Note your Account ID (found in Workers & Pages → Overview)

### 2.2 API Token Creation

Create an API token with the following permissions:

```
Token Name: Emma Form Builder
Permissions:
  - Account - Workers R2 Storage:Edit
  - Account - Workers Scripts:Edit  
  - Account - D1:Edit
  - Zone - Workers Routes:Edit (if using custom domain)

Zone Resources: All zones
Account Resources: All accounts
TTL: No expiry (or set your preferred expiry)
```

Save this token securely - you'll need it for the TUI configuration.

## 3. R2 Storage Setup

### 3.1 Create R2 Bucket

```bash
# Using Wrangler CLI
npx wrangler r2 bucket create emma-forms

# Or via Cloudflare Dashboard:
# 1. Go to R2 → Create bucket
# 2. Name: emma-forms
# 3. Location: Automatic
# 4. Click Create bucket
```

### 3.2 Configure Public Access

R2 buckets are private by default. To serve form JS bundles publicly:

**Option A: R2 Custom Domain**
```bash
# Add custom domain to R2 bucket
# Dashboard: R2 → emma-forms → Settings → Public access
# Domain: forms.yourdomain.com
```

**Option B: Cloudflare Workers (Recommended)**

Create a Worker to proxy R2 with cache control:

```typescript
// workers/r2-proxy.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading slash
    
    // Only allow .js files
    if (!key.endsWith('.js')) {
      return new Response('Not Found', { status: 404 });
    }
    
    const object = await env.FORMS_BUCKET.get(key);
    
    if (!object) {
      return new Response('Form not found', { status: 404 });
    }
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/javascript');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    headers.set('Access-Control-Allow-Origin', '*'); // CORS for embedding
    
    return new Response(object.body, { headers });
  }
};
```

**wrangler.toml:**
```toml
name = "emma-forms-cdn"
main = "workers/r2-proxy.ts"
compatibility_date = "2025-10-07"

[[r2_buckets]]
binding = "FORMS_BUCKET"
bucket_name = "emma-forms"

[routes]
pattern = "forms.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 3.3 File Structure in R2

```
emma-forms/
├── contact-form-001.js          # Individual form bundles
├── newsletter-signup-002.js
├── survey-form-003.js
└── themes/
    ├── default.css              # Optional: Separate theme files
    └── minimal.css
```

## 4. D1 Database Setup

### 4.1 Create Database

```bash
# Create D1 database
npx wrangler d1 create emma-submissions

# Output will show:
# Created database emma-submissions with ID: xxxx-xxxx-xxxx
# Add to wrangler.toml:
# [[d1_databases]]
# binding = "DB"
# database_name = "emma-submissions"
# database_id = "xxxx-xxxx-xxxx"
```

### 4.2 Initialize Schema

Create the database schema:

```sql
-- migrations/0001_initial_schema.sql

-- Forms table: metadata about each form
CREATE TABLE forms (
  id TEXT PRIMARY KEY,                    -- e.g., "contact-form-001"
  name TEXT NOT NULL,                     -- Human-readable name
  schema TEXT NOT NULL,                   -- JSON schema definition
  version TEXT NOT NULL,                  -- Schema version "1.0.0"
  api_endpoint TEXT,                      -- Custom API endpoint if any
  created_at INTEGER NOT NULL,            -- Unix timestamp
  updated_at INTEGER NOT NULL,            -- Unix timestamp
  active INTEGER DEFAULT 1,               -- Soft delete flag
  deploy_count INTEGER DEFAULT 0,         -- Number of deployments
  submission_count INTEGER DEFAULT 0      -- Cached submission count
);

-- Submissions table: actual form submissions
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,                    -- e.g., "sub_abc123xyz"
  form_id TEXT NOT NULL,                  -- Foreign key to forms.id
  data TEXT NOT NULL,                     -- JSON of submitted data
  meta TEXT,                              -- JSON metadata (IP, UA, referrer)
  spam_score INTEGER DEFAULT 0,           -- Spam detection score
  status TEXT DEFAULT 'new',              -- new, read, archived, spam
  created_at INTEGER NOT NULL,            -- Unix timestamp
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_forms_active ON forms(active);

-- Metadata table: for system configuration
CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert initial metadata
INSERT INTO metadata (key, value, updated_at) VALUES 
  ('schema_version', '1', strftime('%s', 'now')),
  ('created_at', strftime('%s', 'now'), strftime('%s', 'now'));
```

Apply the migration:

```bash
# Run migration
npx wrangler d1 execute emma-submissions --file=./migrations/0001_initial_schema.sql

# Verify
npx wrangler d1 execute emma-submissions --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 4.3 Database Access Patterns

**Common Queries:**

```sql
-- Insert form metadata
INSERT INTO forms (id, name, schema, version, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?);

-- Insert submission
INSERT INTO submissions (id, form_id, data, meta, created_at)
VALUES (?, ?, ?, ?, ?);

-- Get form schema for validation
SELECT schema FROM forms WHERE id = ? AND active = 1;

-- Get submissions for a form (paginated)
SELECT id, data, meta, status, created_at 
FROM submissions 
WHERE form_id = ? 
ORDER BY created_at DESC 
LIMIT ? OFFSET ?;

-- Count submissions by form
SELECT COUNT(*) as total FROM submissions WHERE form_id = ?;

-- Update submission count cache
UPDATE forms SET submission_count = submission_count + 1 WHERE id = ?;
```

## 5. Workers Configuration

### 5.1 Submission API Worker

**wrangler.toml:**
```toml
name = "emma-api"
main = "workers/api/index.ts"
compatibility_date = "2025-10-07"

# Environment bindings
[[d1_databases]]
binding = "DB"
database_name = "emma-submissions"
database_id = "your-database-id-here"

[vars]
ENVIRONMENT = "production"
RATE_LIMIT_REQUESTS = "5"
RATE_LIMIT_WINDOW = "60" # seconds

# Routes
[routes]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"

# Development settings
[env.development]
vars = { ENVIRONMENT = "development" }

# Production settings  
[env.production]
vars = { ENVIRONMENT = "production" }
```

### 5.2 Environment Variables & Secrets

```bash
# Set secrets (not in wrangler.toml for security)
npx wrangler secret put API_SECRET_KEY
# Enter secret value when prompted

# Set via dashboard:
# Workers & Pages → emma-api → Settings → Variables
# Add environment variables for different environments
```

**Required Secrets:**
- `API_SECRET_KEY`: For authenticating TUI deployments
- `WEBHOOK_SECRET`: (Optional) For notification webhooks

### 5.3 Rate Limiting

Implement rate limiting using Durable Objects or KV:

```typescript
// Simple rate limiting with KV
export async function checkRateLimit(
  env: Env, 
  ip: string
): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const current = await env.KV.get(key);
  
  if (!current) {
    await env.KV.put(key, '1', { expirationTtl: 60 });
    return true;
  }
  
  const count = parseInt(current);
  if (count >= 5) {
    return false; // Rate limit exceeded
  }
  
  await env.KV.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}
```

## 6. Custom Domain Setup

### 6.1 Forms CDN Domain

```
Domain: forms.yourdomain.com
Purpose: Serve form JS bundles
Worker: emma-forms-cdn

Setup:
1. DNS: Add CNAME record: forms → your-worker.workers.dev
2. Or use Worker route on Cloudflare-proxied domain
3. SSL/TLS: Automatic via Cloudflare
```

### 6.2 API Domain

```
Domain: api.yourdomain.com
Purpose: Form submission endpoint
Worker: emma-api

Setup:
1. DNS: Add CNAME record: api → your-worker.workers.dev
2. Or use Worker route on Cloudflare-proxied domain
3. SSL/TLS: Automatic via Cloudflare
```

## 7. Monitoring & Logs

### 7.1 Workers Analytics

Access via Dashboard:
- Workers & Pages → Analytics & Logs
- Metrics: Requests, errors, CPU time, duration

### 7.2 Real-time Logs

```bash
# Tail logs in real-time
npx wrangler tail emma-api

# Filter by status
npx wrangler tail emma-api --status error

# Output to file
npx wrangler tail emma-api > logs.txt
```

### 7.3 D1 Metrics

```bash
# Check database size
npx wrangler d1 info emma-submissions

# Query metrics
SELECT 
  form_id,
  COUNT(*) as submissions,
  MIN(created_at) as first_submission,
  MAX(created_at) as last_submission
FROM submissions
GROUP BY form_id;
```

## 8. Cost Estimation

**Free Tier Limits:**
- Workers: 100,000 requests/day
- D1: 5 million reads/day, 100k writes/day
- R2: 10GB storage, 1 million Class A operations/month

**Estimated Usage (1000 submissions/day):**
- Workers requests: ~1,000/day (well under limit)
- D1 writes: ~1,000/day (well under limit)
- R2 storage: ~100MB for 1000 forms (under limit)

**Cost: $0/month** for typical small-to-medium usage.

## 9. Deployment Checklist

- [ ] Cloudflare account created
- [ ] API token generated with correct permissions
- [ ] R2 bucket `emma-forms` created
- [ ] D1 database `emma-submissions` created
- [ ] Database schema applied
- [ ] CDN worker deployed for R2 access
- [ ] API worker deployed for submissions
- [ ] Custom domains configured (optional)
- [ ] Secrets set (API keys, etc.)
- [ ] Rate limiting configured
- [ ] Monitoring dashboard reviewed

## 10. Backup & Recovery

### 10.1 Database Backups

```bash
# Export D1 database
npx wrangler d1 export emma-submissions --output=backup.sql

# Restore from backup
npx wrangler d1 execute emma-submissions --file=backup.sql
```

### 10.2 R2 Backups

```bash
# Sync R2 bucket to local
npx wrangler r2 object get emma-forms --file=./backups/

# Restore to R2
npx wrangler r2 object put emma-forms/form.js --file=./backups/form.js
```

**Recommendation:** Set up automated daily backups using GitHub Actions or similar.

---

**Next Steps:** Proceed with Form Builder TUI development.
