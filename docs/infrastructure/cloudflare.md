# Cloudflare Infrastructure Setup

**Related Documents:**

- [00-mvp-embeddable-forms.md](../00-mvp-embeddable-forms.md)
- [02-technical-architecture.md](../02-technical-architecture.md)

## 1. Overview

Emma uses Cloudflare's edge computing platform for hosting, data storage, and API services. This provides global distribution, automatic scaling, and minimal operational overhead.

### Services Used

| Service            | Purpose                               | Pricing Tier                  |
| ------------------ | ------------------------------------- | ----------------------------- |
| Cloudflare R2      | Store static form JS bundles          | Free tier (10GB storage)      |
| Cloudflare Workers | API endpoint for submissions          | Free tier (100k requests/day) |
| Cloudflare D1      | SQLite database for submissions       | Free tier (5GB storage)       |
| Cloudflare Pages   | Optional: Host form builder dashboard | Free tier                     |

## 2. Prerequisites

### 2.1 Cloudflare Account Setup

1. Create a Cloudflare account at https://dash.cloudflare.com/sign-up
2. Add payment method (required even for free tier)
3. Enable Workers and Pages in your account
4. Note your Account ID (found in Workers & Pages → Overview)

### 2.2 Environment Variables Setup

Emma CLI uses environment variables for authentication and never stores credentials on disk. Set up the following environment variables before using `emma init`:

#### Required Environment Variables

```bash
# R2 Storage Access (S3-Compatible API)
export R2_ACCESS_KEY_ID="your-access-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-access-key"
export R2_ACCOUNT_ID="your-cloudflare-account-id"
export R2_BUCKET_NAME="emma-forms"
export R2_PUBLIC_URL="https://forms.example.com"

# Cloudflare API Access (for Worker deployment)
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
```

#### How to Get Credentials

**R2 Access Keys:**

1. Go to Cloudflare Dashboard → R2
2. Click "Manage R2 API Tokens"
3. Create API Token with "Admin Read & Write" permissions
4. Save the Access Key ID and Secret Access Key

**Cloudflare API Token:**

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Create Token → Use template "Edit Cloudflare Workers"
3. Or create custom token with these permissions:
   - Account - Workers R2 Storage: Edit
   - Account - Workers Scripts: Edit
   - Account - D1: Edit
   - Zone - Workers Routes: Edit (if using custom domain)
4. Save the token securely

**Account ID:**

- Found in Workers & Pages → Overview
- Or in any Cloudflare service dashboard URL

#### Setting Environment Variables

**Option 1: Shell Profile (Persistent)**

Add to `~/.bashrc`, `~/.zshrc`, or equivalent:

```bash
# Emma Cloudflare Configuration
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_ACCOUNT_ID="..."
export R2_BUCKET_NAME="emma-forms"
export R2_PUBLIC_URL="https://forms.yourdomain.com"
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_ACCOUNT_ID="..."
```

**Option 2: .env File (Project-Specific)**

Create `.env` in your project directory:

```bash
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=emma-forms
R2_PUBLIC_URL=https://forms.yourdomain.com
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

Then source it: `source .env`

**Option 3: Secret Manager (Production)**

For production/CI environments, use your preferred secret manager:
- GitHub Actions Secrets
- AWS Secrets Manager
- HashiCorp Vault
- 1Password CLI
- etc.

**Important Security Notes:**
- Never commit credentials to version control
- Add `.env` to `.gitignore`
- Use separate tokens for development and production
- Rotate tokens regularly
- Use minimal required permissions

### 2.3 API Token Permissions

For the Cloudflare API token, ensure these specific permissions:

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

## 3. Infrastructure Deployment with `emma init`

### 3.1 Overview

The `emma init` command handles complete infrastructure setup, including:
- Provider selection (Cloudflare, custom, etc.)
- Environment variable verification
- R2 bucket creation
- API Worker deployment via Wrangler
- D1 database creation and migrations
- Infrastructure health checks

### 3.2 Running `emma init`

```bash
# First-time setup
emma init

# Reconfigure or switch providers
emma init --override
```

### 3.3 Interactive Setup Flow

When you run `emma init`, you'll go through these steps:

**Step 1: Provider Selection**

```
? Select deployment provider:
  > Cloudflare (Workers + R2 + D1)
    DigitalOcean Functions (coming soon)
    Custom (bring your own infrastructure)
```

**Step 2: Environment Variable Verification**

```
Checking environment variables...
✓ CLOUDFLARE_API_TOKEN found
✓ R2_ACCESS_KEY_ID found
✓ R2_SECRET_ACCESS_KEY found
✓ R2_ACCOUNT_ID found
✓ CLOUDFLARE_ACCOUNT_ID found

Configuration:
  Provider: Cloudflare
  R2 Bucket: emma-forms
  Public URL: https://forms.yourdomain.com
```

If any required variables are missing, you'll be prompted to set them or cancel.

**Step 3: Infrastructure Deployment**

```
Deploying infrastructure...
→ Creating R2 bucket "emma-forms"... ✓
→ Deploying API worker to Cloudflare... ✓
→ Creating D1 database "emma-submissions"... ✓
→ Running database migrations... ✓
→ Testing API worker endpoint... ✓

Infrastructure deployed successfully!
```

**Step 4: Configuration Save**

```
Saving configuration to ~/.emma/config.json

Configuration saved:
  Provider: cloudflare
  Default theme: default
  Local server port: 3333
  Local server host: localhost

Ready to create forms!
Try: emma create my-first-form
```

### 3.4 What Gets Deployed

**R2 Bucket:**
- Bucket name: `emma-forms` (or custom)
- Purpose: Store form JavaScript bundles
- Access: Public read via Worker or custom domain

**API Worker:**
- Worker name: `emma-api`
- Purpose: Handle form submissions
- Bindings: D1 database, R2 bucket
- Routes: Configured based on your domain

**D1 Database:**
- Database name: `emma-submissions`
- Purpose: Store form schemas and submissions
- Schema: Automatically migrated with snapshot support

### 3.5 Configuration Storage

Emma stores **only non-sensitive** configuration in `~/.emma/config.json`:

```json
{
  "provider": "cloudflare",
  "defaultTheme": "default",
  "localServerPort": 3333,
  "localServerHost": "localhost"
}
```

**Credentials are NEVER stored in this file.** All authentication uses environment variables.

### 3.6 Reconfiguration

To reconfigure or switch providers:

```bash
emma init --override
```

This will:
- Restart the entire setup process
- Allow changing provider or configuration
- Preserve existing forms (they remain in `~/.emma/forms/`)
- Update `~/.emma/config.json` with new settings

### 3.7 Troubleshooting

**Missing Environment Variables:**

```
✗ Error: Required environment variable R2_ACCESS_KEY_ID not set

Please set the following environment variables:
  export R2_ACCESS_KEY_ID="your-access-key"
  export R2_SECRET_ACCESS_KEY="your-secret-key"
  export CLOUDFLARE_API_TOKEN="your-token"

Then run: emma init
```

**Infrastructure Deployment Failed:**

```
✗ Error: Failed to create R2 bucket

Common causes:
  - Invalid API token permissions
  - Bucket name already exists
  - Account quota exceeded

Check your Cloudflare dashboard for details.
```

**Worker Deployment Failed:**

```
✗ Error: Failed to deploy API worker

Possible solutions:
  - Verify CLOUDFLARE_API_TOKEN has Workers Scripts:Edit permission
  - Check that your account has Workers enabled
  - Ensure CLOUDFLARE_ACCOUNT_ID is correct
```

## 4. R2 Storage Setup

### 4.1 Create R2 Bucket

```bash
# Using Wrangler CLI
npx wrangler r2 bucket create emma-forms

# Or via Cloudflare Dashboard:
# 1. Go to R2 → Create bucket
# 2. Name: emma-forms
# 3. Location: Automatic
# 4. Click Create bucket
```

### 4.2 Configure Public Access

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
  },
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

### 4.3 File Structure in R2

```
emma-forms/
├── contact-form-001.js          # Individual form bundles
├── newsletter-signup-002.js
├── survey-form-003.js
└── themes/
    ├── default.css              # Optional: Separate theme files
    └── minimal.css
```

## 5. D1 Database Setup

### 5.1 Create Database

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

### 5.2 Initialize Schema

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

### 5.3 Database Access Patterns

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

## 6. Workers Configuration

### 6.1 Submission API Worker

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

### 6.2 Environment Variables & Secrets

**Note:** Emma CLI does not use these secrets directly. These are for the deployed Worker itself. CLI authentication uses environment variables only (see Section 2.2).

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

### 6.3 Rate Limiting

Implement rate limiting using Durable Objects or KV:

```typescript
// Simple rate limiting with KV
export async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
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

## 7. Custom Domain Setup

### 7.1 Forms CDN Domain

```
Domain: forms.yourdomain.com
Purpose: Serve form JS bundles
Worker: emma-forms-cdn

Setup:
1. DNS: Add CNAME record: forms → your-worker.workers.dev
2. Or use Worker route on Cloudflare-proxied domain
3. SSL/TLS: Automatic via Cloudflare
```

### 7.2 API Domain

```
Domain: api.yourdomain.com
Purpose: Form submission endpoint
Worker: emma-api

Setup:
1. DNS: Add CNAME record: api → your-worker.workers.dev
2. Or use Worker route on Cloudflare-proxied domain
3. SSL/TLS: Automatic via Cloudflare
```

## 8. Monitoring & Logs

### 8.1 Workers Analytics

Access via Dashboard:

- Workers & Pages → Analytics & Logs
- Metrics: Requests, errors, CPU time, duration

### 8.2 Real-time Logs

```bash
# Tail logs in real-time
npx wrangler tail emma-api

# Filter by status
npx wrangler tail emma-api --status error

# Output to file
npx wrangler tail emma-api > logs.txt
```

### 8.3 D1 Metrics

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

## 9. Cost Estimation

**Free Tier Limits:**

- Workers: 100,000 requests/day
- D1: 5 million reads/day, 100k writes/day
- R2: 10GB storage, 1 million Class A operations/month

**Estimated Usage (1000 submissions/day):**

- Workers requests: ~1,000/day (well under limit)
- D1 writes: ~1,000/day (well under limit)
- R2 storage: ~100MB for 1000 forms (under limit)

**Cost: $0/month** for typical small-to-medium usage.

## 10. Deployment Checklist

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

## 11. Backup & Recovery

### 11.1 Database Backups

```bash
# Export D1 database
npx wrangler d1 export emma-submissions --output=backup.sql

# Restore from backup
npx wrangler d1 execute emma-submissions --file=backup.sql
```

### 11.2 R2 Backups

```bash
# Sync R2 bucket to local
npx wrangler r2 object get emma-forms --file=./backups/

# Restore to R2
npx wrangler r2 object put emma-forms/form.js --file=./backups/form.js
```

**Recommendation:** Set up automated daily backups using GitHub Actions or similar.

---

**Next Steps:** Proceed with Form Builder TUI development.
