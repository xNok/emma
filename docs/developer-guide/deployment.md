# Deployment Guide

This comprehensive guide walks you through deploying Emma forms from initial infrastructure setup to form deployment and ongoing maintenance.

## Overview

The Emma deployment workflow consists of three main phases:

1. **Infrastructure Setup**: One-time setup of Cloudflare services (`emma init`)
2. **Form Creation**: Building forms and testing locally (`emma create`, `emma build`, `emma preview`)
3. **Form Deployment**: Deploying forms to production (`emma deploy`)

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Emma CLI installed (`npm install -g @emma/form-builder`)
- [ ] Cloudflare account created
- [ ] Environment variables configured (see [Environment Setup Guide](./environment-setup.md))

Quick environment check:

```bash
# Verify Emma CLI installation
emma --version

# Check environment variables
echo $CLOUDFLARE_API_TOKEN
echo $R2_ACCESS_KEY_ID
echo $R2_BUCKET_NAME
```

## Phase 1: Infrastructure Setup

### Step 1: Run `emma init`

This deploys all required Cloudflare infrastructure:

```bash
emma init
```

**What happens:**

1. **Provider Selection**: Choose Cloudflare (or custom provider)
2. **Environment Verification**: Emma checks all required environment variables
3. **R2 Bucket Creation**: Creates bucket for storing form bundles
4. **API Worker Deployment**: Deploys Worker to handle form submissions
5. **D1 Database Setup**: Creates database for submissions
6. **Database Migrations**: Initializes schema with snapshot support
7. **Health Checks**: Verifies everything is working
8. **Config Save**: Stores non-sensitive settings to `~/.emma/config.json`

**Example output:**

```bash
$ emma init
🚀 Initializing Emma Forms CLI...

? Select deployment provider: Cloudflare (Workers + R2 + D1)

Checking environment variables...
✓ CLOUDFLARE_API_TOKEN found
✓ R2_ACCESS_KEY_ID found
✓ R2_SECRET_ACCESS_KEY found
✓ R2_ACCOUNT_ID found

Deploying infrastructure...
→ Creating R2 bucket "emma-forms"... ✓
→ Deploying API worker to Cloudflare... ✓
→ Creating D1 database "emma-submissions"... ✓
→ Running database migrations... ✓
→ Testing API worker endpoint... ✓

✓ Infrastructure deployed successfully!

Configuration saved:
  Provider: cloudflare
  R2 Bucket: emma-forms
  Public URL: https://forms.yourdomain.com
  API Endpoint: https://api.yourdomain.com
  Forms directory: /home/user/.emma/forms
  Builds directory: /home/user/.emma/builds

Ready to create forms!
Try: emma create my-first-form
```

### Step 2: Verify Infrastructure

Check that everything deployed correctly:

```bash
# Verify R2 bucket
# Via Cloudflare Dashboard:
# R2 → Should see "emma-forms" bucket

# Verify Worker
# Workers & Pages → Should see "emma-api" worker

# Verify D1 Database
# D1 → Should see "emma-submissions" database
```

### Troubleshooting Infrastructure Setup

**Issue: Missing environment variables**

```
✗ Error: Required environment variable R2_ACCESS_KEY_ID not set
```

**Solution**: Set missing variables (see [Environment Setup Guide](./environment-setup.md))

```bash
export R2_ACCESS_KEY_ID="your-access-key"
export R2_SECRET_ACCESS_KEY="your-secret-key"
emma init
```

**Issue: Permission denied**

```
✗ Error: Failed to create R2 bucket - Permission denied
```

**Solution**: Verify API token has correct permissions:

- Account - Workers R2 Storage: Edit
- Account - Workers Scripts: Edit
- Account - D1: Edit

**Issue: Worker deployment failed**

```
✗ Error: Failed to deploy API worker
```

**Solution**:

1. Check CLOUDFLARE_API_TOKEN is valid
2. Verify account has Workers enabled
3. Check account quotas (free tier limits)
4. Review Cloudflare dashboard for error details

## Phase 2: Form Creation

### Step 1: Create Your First Form

```bash
emma create contact-form
```

Follow the interactive prompts:

```bash
📝 Creating a new form...

? Form display name: Contact Form
? Select a theme: default
? Submit button text: Send Message
? Success message: Thank you! We'll be in touch soon.

📋 Adding form fields...

? Add field 1: Text Input
  ? Field label: Your Name
  ? Field ID: name
  ? Placeholder text (optional): Enter your full name
  ? Required field? Yes
  ? Add validation rules? Yes
    ? Minimum length: 2
    ? Maximum length: 100

? Add field 2: Email
  ? Field label: Email Address
  ? Field ID: email
  ? Required field? Yes

? Add field 3: Textarea
  ? Field label: Message
  ? Field ID: message
  ? Number of rows: 5
  ? Required field? Yes
  ? Add validation rules? Yes
    ? Minimum length: 10
    ? Maximum length: 1000

? Add field 4: ✅ Done adding fields

? Enable spam protection (honeypot)? Yes

🎉 Form created successfully!

Form Details:
  ID: contact-form
  Name: Contact Form
  Theme: default
  Fields: 3
  Snapshot: 1729089000 (initial)
  Location: /home/user/.emma/forms/contact-form.yaml

Next steps:
  $ emma build contact-form   # Build JavaScript bundle
  $ emma preview contact-form # Preview in browser
  $ emma deploy contact-form  # Deploy to Cloudflare
```

### Step 2: Build the Form Bundle

```bash
emma build contact-form
```

This creates:

- `~/.emma/builds/contact-form/form.js` - JavaScript bundle
- `~/.emma/builds/contact-form/index.html` - Preview page
- `~/.emma/builds/contact-form/themes/` - Theme CSS files

**Output:**

```bash
$ emma build contact-form

Building form: Contact Form

✓ Form bundle built successfully

Build results:
  Bundle: /home/user/.emma/builds/contact-form/form.js
  Size: 12.5 KB (3.1 KB gzipped)
  Snapshot: 1729089000
  Output: /home/user/.emma/builds/contact-form

Next steps:
  $ emma preview contact-form  # Test locally
  $ emma deploy contact-form   # Deploy to production
```

### Step 3: Preview and Test Locally

```bash
emma preview contact-form
```

This starts a local server and opens your browser:

```bash
$ emma preview contact-form

📝 Form Preview

Name: Contact Form
Theme: default
Fields: 3
Snapshot: 1729089000

URLs:
  Form: http://localhost:3333/forms/contact-form
  API:  http://localhost:3333/api/submit/contact-form

🌐 Opening in browser...

Server running. Press Ctrl+C to stop.
```

**Test checklist:**

- [ ] Form renders correctly
- [ ] All fields appear as expected
- [ ] Field validation works
- [ ] Form submits successfully
- [ ] Success message displays
- [ ] Honeypot protection is invisible
- [ ] Responsive design looks good on mobile

## Phase 3: Production Deployment

### Deployment Option 1: Deploy Current Snapshot

Deploy the latest version of your form:

```bash
emma deploy contact-form
```

**What happens:**

1. Verifies environment variables
2. Builds form bundle with current snapshot
3. Uploads bundle to R2: `contact-form-<timestamp>.js`
4. Updates form registry in R2
5. Provides public URL

**Output:**

```bash
$ emma deploy contact-form

Deploying form: Contact Form
Snapshot: 1729089000 (current)

→ Building form bundle... ✓
→ Uploading to R2 bucket "emma-forms"... ✓
→ Updating form registry... ✓

✓ Form deployed successfully!

Deployment:
  Bundle: contact-form-1729089000.js
  Size: 12.5 KB
  URL: https://forms.yourdomain.com/contact-form-1729089000.js

Hugo Integration:
  {{< embed-form "contact-form" >}}

HTML Integration:
  <div id="embeddable-form-contact-form"></div>
  <script src="https://forms.yourdomain.com/contact-form-1729089000.js"></script>
```

### Deployment Option 2: Deploy Specific Snapshot

Deploy or rollback to a specific snapshot:

```bash
# View available snapshots
emma history contact-form

# Deploy specific snapshot
emma deploy contact-form --snapshot 1727780400
```

**Use cases:**

- **Rollback**: Revert to previous working version
- **Testing**: Deploy historical version for comparison
- **A/B Testing**: Deploy multiple snapshots simultaneously

### Deployment Option 3: Deploy to Custom Location

Override default bucket/URL settings:

```bash
emma deploy cloudflare contact-form \
  --bucket custom-bucket \
  --public-url https://custom-cdn.example.com \
  --overwrite
```

## Integration with Hugo

### Step 1: Configure Hugo Site

Add Emma CDN URL to your `hugo.toml` or `config.toml`:

```toml
[params.emma]
  cdnUrl = "https://forms.yourdomain.com"
```

### Step 2: Embed Form in Content

Add the shortcode to any markdown file:

```markdown
---
title: Contact Us
date: 2025-10-16
---

# Get in Touch

We'd love to hear from you!

{{< embed-form "contact-form" >}}

Or email us at: contact@example.com
```

### Step 3: Build and Preview Hugo Site

```bash
hugo server

# Visit your page to see the embedded form
# http://localhost:1313/contact/
```

### Step 4: Deploy Hugo Site

Deploy your Hugo site with the embedded form:

```bash
# Build Hugo site
hugo

# Deploy to your hosting provider
# (Netlify, Vercel, Cloudflare Pages, etc.)
```

## Ongoing Maintenance

### Updating a Form

When you need to modify a form:

```bash
# Edit form (creates new snapshot)
emma edit contact-form

# Build new version
emma build contact-form

# Test locally
emma preview contact-form

# Deploy new snapshot
emma deploy contact-form
```

**Result:**

- New snapshot created with timestamp
- Old snapshot remains available
- Can rollback if issues arise
- Existing integrations continue working

### Viewing Form History

```bash
emma history contact-form
```

Shows all snapshots, deployments, and changes.

### Rolling Back a Deployment

If you deploy a form and discover issues:

```bash
# Check history to find previous working snapshot
emma history contact-form

# Rollback to previous snapshot
emma deploy contact-form --snapshot 1728900000

# Verify rollback worked
# Fix issues locally
# Deploy fixed version when ready
```

### Managing Multiple Forms

```bash
# List all forms
emma list --detailed

# Deploy multiple forms
emma deploy contact-form
emma deploy newsletter-signup
emma deploy survey-form

# Create form naming convention:
# - contact-form (main contact)
# - contact-form-simple (simplified version)
# - contact-form-v2 (major redesign)
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy-forms.yml
name: Deploy Emma Forms

on:
  push:
    branches: [main]
    paths:
      - '.emma/forms/**'
      - '.github/workflows/deploy-forms.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

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
          # Initialize (skips if already done)
          emma init

          # Deploy all forms
          for form in ~/.emma/forms/*.yaml; do
            form_id=$(basename "$form" .yaml)
            echo "Deploying $form_id..."
            emma deploy "$form_id"
          done
```

### GitLab CI Example

```yaml
# .gitlab-ci.yml
deploy-forms:
  stage: deploy
  image: node:18

  only:
    refs:
      - main
    changes:
      - .emma/forms/**

  script:
    - npm install -g @emma/form-builder
    - emma init
    - |
      for form_file in ~/.emma/forms/*.yaml; do
        form_id=$(basename "$form_file" .yaml)
        echo "Deploying $form_id..."
        emma deploy "$form_id"
      done

  variables:
    R2_ACCESS_KEY_ID: $R2_ACCESS_KEY_ID
    R2_SECRET_ACCESS_KEY: $R2_SECRET_ACCESS_KEY
    R2_ACCOUNT_ID: $R2_ACCOUNT_ID
    R2_BUCKET_NAME: $R2_BUCKET_NAME
    R2_PUBLIC_URL: $R2_PUBLIC_URL
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
    CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID
```

## Multi-Environment Deployment

### Setup Different Environments

Create environment-specific configuration:

```bash
# Development
export R2_BUCKET_NAME="emma-forms-dev"
export R2_PUBLIC_URL="https://forms-dev.yourdomain.com"
emma init
emma deploy contact-form

# Staging
export R2_BUCKET_NAME="emma-forms-staging"
export R2_PUBLIC_URL="https://forms-staging.yourdomain.com"
emma init
emma deploy contact-form

# Production
export R2_BUCKET_NAME="emma-forms-prod"
export R2_PUBLIC_URL="https://forms.yourdomain.com"
emma init
emma deploy contact-form
```

### Environment-Specific Scripts

```bash
# scripts/deploy-dev.sh
#!/bin/bash
source .env.development
emma deploy "$1"

# scripts/deploy-staging.sh
#!/bin/bash
source .env.staging
emma deploy "$1"

# scripts/deploy-prod.sh
#!/bin/bash
source .env.production
emma deploy "$1"

# Usage:
./scripts/deploy-dev.sh contact-form
./scripts/deploy-prod.sh contact-form
```

## Monitoring and Analytics

### Check Deployment Status

Via Cloudflare Dashboard:

1. **R2 Storage**: R2 → emma-forms → View objects
   - Verify form bundles are uploaded
   - Check file sizes and timestamps

2. **API Worker**: Workers & Pages → emma-api
   - View request metrics
   - Check error rates
   - Review logs

3. **D1 Database**: D1 → emma-submissions
   - Check table row counts
   - View recent submissions
   - Monitor database size

### View Form Analytics

```bash
# Via Emma CLI (future feature)
emma stats contact-form

# Via Cloudflare Dashboard
# Workers → emma-api → Analytics
# See submission rates, success rates, errors
```

## Best Practices

### 1. Version Control Form Definitions

Store form YAML files in Git:

```bash
# Add to version control
git add ~/.emma/forms/*.yaml
git commit -m "Update contact form with phone field"
git push
```

### 2. Test Before Production

Always test forms locally before deploying:

```bash
emma build contact-form
emma preview contact-form
# → Test thoroughly
emma deploy contact-form
```

### 3. Use Descriptive Snapshot Changes

```yaml
snapshots:
  - timestamp: 1729089000
    changes: 'Added phone field per sales team request (Ticket #456)'
    # Not just: "Updated form"
```

### 4. Document Major Changes

Keep a changelog for significant form updates:

```markdown
# CHANGELOG.md

## Contact Form

### 2025-10-16 - Added Phone Field

- Added optional phone number field
- Snapshot: 1729089000
- Reason: Sales team requested for better follow-up

### 2025-10-14 - Updated Messages

- Improved success message clarity
- Snapshot: 1728900000
```

### 5. Monitor Submission Rates

Set up alerts for unusual patterns:

- Sudden drop in submissions (form broken?)
- Sudden spike (spam attack?)
- High error rates (validation issues?)

### 6. Regular Backups

Backup form definitions and configurations:

```bash
# Backup script
#!/bin/bash
backup_dir="~/emma-backups/$(date +%Y%m%d)"
mkdir -p "$backup_dir"
cp -r ~/.emma/forms/* "$backup_dir/"
tar -czf "$backup_dir.tar.gz" "$backup_dir"
```

## Troubleshooting

### Form Not Loading on Website

1. Check browser console for errors
2. Verify CDN URL is correct in Hugo config
3. Confirm bundle exists in R2
4. Check CORS settings on R2 bucket
5. Verify form ID matches in shortcode

### Submissions Not Being Received

1. Check API Worker logs in Cloudflare dashboard
2. Test form submission directly with curl
3. Verify D1 database is accessible
4. Check Worker bindings are correct
5. Review rate limiting settings

### Deployment Failed

1. Verify environment variables are set
2. Check API token permissions
3. Review Cloudflare account quotas
4. Check network connectivity
5. View detailed error in CLI output

## Next Steps

Now that you understand deployment:

1. **Create production forms**: `emma create <form-name>`
2. **Set up CI/CD**: Automate deployments with GitHub Actions
3. **Monitor performance**: Use Cloudflare analytics
4. **Plan updates**: Use snapshot strategy for safe updates
5. **Scale**: Deploy multiple forms as needed

## Related Documentation

- [CLI Reference](./cli-reference.md) - All Emma commands
- [Environment Setup](./environment-setup.md) - Configure credentials
- [Form History Guide](./form-history.md) - Understanding snapshots
- [Cloudflare Infrastructure](../infrastructure/cloudflare.md) - Infrastructure details
- [Hugo Integration](./hugo-integration.md) - Embed forms in Hugo

## Support

If you encounter issues:

1. Check [Troubleshooting Guide](./troubleshooting.md)
2. Review [Cloudflare Documentation](https://developers.cloudflare.com/)
3. Open an issue on GitHub
4. Ask in community forums
