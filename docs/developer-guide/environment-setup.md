# Environment Setup Guide

This guide explains how to configure the environment variables required to use Emma CLI with Cloudflare infrastructure.

## Overview

Emma CLI uses environment variables for all authentication and never stores credentials on disk. This approach provides:

- **Security**: No credentials stored in configuration files
- **Flexibility**: Easy switching between development, staging, and production
- **CI/CD Friendly**: Works seamlessly in automated pipelines
- **Simplicity**: No credential management needed by the CLI

## Required Environment Variables

### For Cloudflare Provider

When using Cloudflare as your deployment provider, you need two sets of credentials:

#### 1. R2 Storage Access (S3-Compatible API)

These credentials are used to upload form bundles to R2:

```bash
export R2_ACCESS_KEY_ID="your-access-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-access-key"
export R2_ACCOUNT_ID="your-cloudflare-account-id"
export R2_BUCKET_NAME="emma-forms"
export R2_PUBLIC_URL="https://forms.yourdomain.com"
```

#### 2. Cloudflare API Access (Worker Deployment)

These credentials are used to deploy the API Worker and manage D1:

```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
```

## How to Get Credentials

### Step 1: Get Your Cloudflare Account ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Overview**
3. Copy your **Account ID** from the right sidebar
4. Alternatively, look at any Cloudflare service URL - it contains your account ID

### Step 2: Create R2 API Token

1. Go to **R2** → **Overview**
2. Click **Manage R2 API Tokens**
3. Click **Create API Token**
4. Configure the token:
   - **Token Name**: `Emma CLI - R2 Access`
   - **Permissions**: Admin Read & Write
   - **TTL**: No expiry (or set your preferred expiry)
5. Click **Create API Token**
6. **Important**: Copy both the **Access Key ID** and **Secret Access Key** immediately
   - You won't be able to see the Secret Access Key again
   - Store them securely (password manager recommended)

### Step 3: Create Cloudflare API Token

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Choose **Edit Cloudflare Workers** template or create custom token
4. Configure permissions:
   - **Account** → **Workers R2 Storage** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **D1** → **Edit**
   - **Zone** → **Workers Routes** → **Edit** (optional, only if using custom domain)
5. Set **Account Resources**:
   - Include → **Specific account** → Select your account
6. Set **Zone Resources**:
   - Include → **All zones** (or specific zones if preferred)
7. Set **Client IP Address Filtering** (optional):
   - Restrict to your IP or VPN for added security
8. Set **TTL**: Choose expiry time (90 days recommended, or no expiry)
9. Click **Continue to summary** → **Create Token**
10. **Important**: Copy the token immediately and store it securely

### Step 4: Determine Your R2 Public URL

You have three options for serving forms:

**Option A: R2.dev Subdomain (Quick Start)**

```bash
export R2_PUBLIC_URL="https://pub-[bucket-hash].r2.dev"
```

To get this URL:
1. Go to R2 → Your bucket → Settings
2. Enable "Public Access" under "Public Bucket Access"
3. Copy the R2.dev domain

**Option B: Custom Domain (Recommended)**

```bash
export R2_PUBLIC_URL="https://forms.yourdomain.com"
```

Setup instructions in [Custom Domain Setup](#custom-domain-setup).

**Option C: Worker Proxy (Most Flexible)**

```bash
export R2_PUBLIC_URL="https://your-worker.workers.dev"
```

The API worker can serve forms if configured (see [Cloudflare Infrastructure](../infrastructure/cloudflare.md)).

## Setting Environment Variables

Choose the method that works best for your workflow:

### Method 1: Shell Profile (Persistent for All Sessions)

**For Bash (~/.bashrc or ~/.bash_profile):**

```bash
# Add to ~/.bashrc or ~/.bash_profile
# Emma Cloudflare Configuration
export R2_ACCESS_KEY_ID="8a7b6c5d..."
export R2_SECRET_ACCESS_KEY="1234567890abcdef..."
export R2_ACCOUNT_ID="abc123def456..."
export R2_BUCKET_NAME="emma-forms"
export R2_PUBLIC_URL="https://forms.yourdomain.com"
export CLOUDFLARE_API_TOKEN="xyz789..."
export CLOUDFLARE_ACCOUNT_ID="abc123def456..."

# Reload the profile
source ~/.bashrc
```

**For Zsh (~/.zshrc):**

```bash
# Add to ~/.zshrc
# Emma Cloudflare Configuration
export R2_ACCESS_KEY_ID="8a7b6c5d..."
export R2_SECRET_ACCESS_KEY="1234567890abcdef..."
export R2_ACCOUNT_ID="abc123def456..."
export R2_BUCKET_NAME="emma-forms"
export R2_PUBLIC_URL="https://forms.yourdomain.com"
export CLOUDFLARE_API_TOKEN="xyz789..."
export CLOUDFLARE_ACCOUNT_ID="abc123def456..."

# Reload the profile
source ~/.zshrc
```

### Method 2: .env File (Project-Specific)

Create a `.env` file in your project directory:

```bash
# .env
R2_ACCESS_KEY_ID=8a7b6c5d...
R2_SECRET_ACCESS_KEY=1234567890abcdef...
R2_ACCOUNT_ID=abc123def456...
R2_BUCKET_NAME=emma-forms
R2_PUBLIC_URL=https://forms.yourdomain.com
CLOUDFLARE_API_TOKEN=xyz789...
CLOUDFLARE_ACCOUNT_ID=abc123def456...
```

**Important**: Add `.env` to your `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

Load the environment variables before running Emma:

```bash
# Load .env file
source .env

# Or use a tool like direnv
echo "source .env" > .envrc
direnv allow
```

### Method 3: Inline (Temporary for Single Command)

```bash
R2_ACCESS_KEY_ID="..." \
R2_SECRET_ACCESS_KEY="..." \
R2_ACCOUNT_ID="..." \
CLOUDFLARE_API_TOKEN="..." \
emma init
```

### Method 4: CI/CD Secrets (GitHub Actions, GitLab CI, etc.)

**GitHub Actions:**

```yaml
# .github/workflows/deploy-forms.yml
name: Deploy Forms

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Emma CLI
        run: npm install -g @emma/form-builder
      
      - name: Deploy Forms
        env:
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
          R2_PUBLIC_URL: ${{ secrets.R2_PUBLIC_URL }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          emma init
          emma deploy contact-form
```

Add secrets in **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

**GitLab CI:**

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  image: node:18
  script:
    - npm install -g @emma/form-builder
    - emma init
    - emma deploy contact-form
  variables:
    R2_ACCESS_KEY_ID: $R2_ACCESS_KEY_ID
    R2_SECRET_ACCESS_KEY: $R2_SECRET_ACCESS_KEY
    R2_ACCOUNT_ID: $R2_ACCOUNT_ID
    R2_BUCKET_NAME: $R2_BUCKET_NAME
    R2_PUBLIC_URL: $R2_PUBLIC_URL
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
    CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID
  only:
    - main
```

Add variables in **Settings** → **CI/CD** → **Variables**.

## Multiple Environments

You can manage different environments by using different sets of environment variables:

### Development Environment

```bash
# .env.development
R2_BUCKET_NAME=emma-forms-dev
R2_PUBLIC_URL=https://forms-dev.yourdomain.com
# ... other dev credentials
```

### Staging Environment

```bash
# .env.staging
R2_BUCKET_NAME=emma-forms-staging
R2_PUBLIC_URL=https://forms-staging.yourdomain.com
# ... other staging credentials
```

### Production Environment

```bash
# .env.production
R2_BUCKET_NAME=emma-forms-prod
R2_PUBLIC_URL=https://forms.yourdomain.com
# ... other production credentials
```

Switch environments by loading the appropriate file:

```bash
# Deploy to development
source .env.development
emma deploy contact-form

# Deploy to production
source .env.production
emma deploy contact-form
```

## Security Best Practices

### 1. Never Commit Credentials

Always add credential files to `.gitignore`:

```bash
# .gitignore
.env
.env.*
*.key
*.pem
secrets/
```

### 2. Use Minimal Required Permissions

Create separate API tokens for different purposes:
- **Development**: Token with read-only access
- **CI/CD**: Token with write access but restricted IPs
- **Production**: Token with full access but short expiry

### 3. Rotate Credentials Regularly

- Rotate API tokens every 90 days
- Update CI/CD secrets when rotating
- Keep a log of token creation/rotation dates

### 4. Use Secret Management Tools

For production environments, consider:
- **1Password CLI**: `op read "op://vault/item/field"`
- **AWS Secrets Manager**: `aws secretsmanager get-secret-value`
- **HashiCorp Vault**: `vault kv get secret/emma`
- **Azure Key Vault**: `az keyvault secret show`

Example with 1Password:

```bash
export R2_ACCESS_KEY_ID=$(op read "op://Emma/Cloudflare/R2_ACCESS_KEY_ID")
export R2_SECRET_ACCESS_KEY=$(op read "op://Emma/Cloudflare/R2_SECRET_ACCESS_KEY")
emma deploy contact-form
```

### 5. Restrict Token Access

- Use IP filtering when possible
- Set appropriate TTL (expiry time)
- Use separate tokens per environment
- Monitor token usage in Cloudflare dashboard

## Verification

Test that your environment is configured correctly:

```bash
# Check if variables are set
echo $R2_ACCESS_KEY_ID      # Should show: 8a7b6c5d...
echo $R2_BUCKET_NAME        # Should show: emma-forms
echo $CLOUDFLARE_API_TOKEN  # Should show: xyz789...

# Try running emma init
emma init

# Expected output:
# ✓ CLOUDFLARE_API_TOKEN found
# ✓ R2_ACCESS_KEY_ID found
# ✓ R2_SECRET_ACCESS_KEY found
# ...
```

## Troubleshooting

### Error: Environment variable not set

```
✗ Error: Required environment variable R2_ACCESS_KEY_ID not set
```

**Solution**: Ensure the variable is exported, not just set:

```bash
# Wrong (not exported)
R2_ACCESS_KEY_ID="value"

# Correct (exported)
export R2_ACCESS_KEY_ID="value"
```

### Error: Invalid credentials

```
✗ Error: Failed to authenticate with Cloudflare
```

**Solutions**:
1. Verify credentials are correct (copy-paste errors are common)
2. Check token permissions match requirements
3. Ensure token hasn't expired
4. Verify Account ID matches the token's account

### Error: Permission denied

```
✗ Error: Permission denied: Workers Scripts:Edit
```

**Solution**: Update your API token permissions:
1. Go to API Tokens in Cloudflare dashboard
2. Edit the token
3. Add missing permissions
4. Save and update your `CLOUDFLARE_API_TOKEN` variable

### Variables not persisting

**Solution**: Ensure you're adding to the correct profile file and sourcing it:

```bash
# Verify which shell you're using
echo $SHELL

# For bash: edit ~/.bashrc
# For zsh: edit ~/.zshrc

# After editing, reload
source ~/.bashrc  # or source ~/.zshrc
```

## Custom Domain Setup

To use a custom domain for serving forms:

### Step 1: Add CNAME Record

In your DNS provider, add a CNAME record:

```
Type: CNAME
Name: forms
Target: your-bucket.r2.cloudflarestorage.com
TTL: Auto (or 300)
```

### Step 2: Configure Custom Domain in Cloudflare

1. Go to **R2** → Your bucket → **Settings**
2. Under **Custom Domains**, click **Connect Domain**
3. Enter your domain: `forms.yourdomain.com`
4. Click **Continue** and follow the prompts

### Step 3: Update Environment Variable

```bash
export R2_PUBLIC_URL="https://forms.yourdomain.com"
```

### Step 4: Wait for DNS Propagation

DNS changes can take up to 24-48 hours but usually propagate within minutes. Check status:

```bash
dig forms.yourdomain.com
# or
nslookup forms.yourdomain.com
```

## Next Steps

Once your environment is set up:

1. Run `emma init` to deploy infrastructure
2. Create your first form: `emma create my-form`
3. Deploy it: `emma deploy my-form`
4. View the deployment guide: [Deployment Guide](./deployment.md)

## Related Documentation

- [Cloudflare Infrastructure Setup](../infrastructure/cloudflare.md)
- [CLI Reference](./cli-reference.md)
- [Deployment Guide](./deployment.md)
- [Form History Guide](./form-history.md)
