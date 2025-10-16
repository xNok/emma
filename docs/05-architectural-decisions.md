# Architectural Decisions

**Document Number:** 05  
**Date:** October 16, 2025  
**Status:** Final  
**Previous:** [04-api-worker-architecture.md](./04-api-worker-architecture.md)

## 1. Purpose

This document formally addresses the open architectural questions from [01-project-foundation.md](./01-project-foundation.md) that are required for v1.0 release. These decisions establish clear technical approaches for CLI authentication, form versioning, and change management.

## 2. Authentication Strategy for CLI Deployment

### 2.1 Problem Statement

The Form Builder CLI needs to securely authenticate with Cloudflare services to:

- Deploy forms to R2 storage
- Deploy and configure the API worker
- Set up and manage the D1 database

This is a blocker for implementing the deployment feature.

### 2.2 Requirements

- **Security**: No credential storage - rely on environment variables only
- **Simplicity**: Easy setup for developers with minimal configuration
- **Flexibility**: Support different environments (development, staging, production)
- **Infrastructure Setup**: `emma init` handles complete provider setup including API worker deployment

### 2.3 Decision: Environment Variables Only - No Credential Storage

**Core Principle**: Emma CLI will NEVER store credentials. All authentication relies on environment variables.

#### Configuration Approach

1. **R2 Access (S3-Compatible API)**

   ```bash
   # Required environment variables for form deployment
   export R2_ACCESS_KEY_ID="your-access-key-id"
   export R2_SECRET_ACCESS_KEY="your-secret-access-key"
   export R2_ACCOUNT_ID="your-cloudflare-account-id"
   export R2_BUCKET_NAME="emma-forms"
   export R2_PUBLIC_URL="https://forms.example.com"
   ```

2. **API Worker Deployment (via Wrangler)**

   ```bash
   # Required for deploying/managing the API worker
   export CLOUDFLARE_API_TOKEN="your-api-token"
   export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
   ```

3. **Non-Secret Configuration Only**

   The `~/.emma/config.json` stores ONLY non-sensitive settings:

   ```json
   {
     "provider": "cloudflare",
     "defaultTheme": "default",
     "localServerPort": 3333,
     "localServerHost": "localhost"
   }
   ```

   **Credentials are NEVER stored in this file.**

#### Token Permissions Required

Create a Cloudflare API token with these permissions:

- **Account - Workers R2 Storage**: Edit
- **Account - Workers Scripts**: Edit
- **Account - D1**: Edit
- **Zone - Workers Routes**: Edit (if using custom domain)

#### CLI Workflow

**Initial Setup with Infrastructure Deployment**

```bash
# Run init to set up provider and deploy infrastructure
emma init

# Interactive prompts:
# 1. Select deployment provider:
#    > Cloudflare (Workers + R2 + D1)
#    > DigitalOcean Functions (coming soon)
#    > Custom (bring your own infrastructure)
#
# 2. Verify environment variables are set:
#    ✓ CLOUDFLARE_API_TOKEN found
#    ✓ R2_ACCESS_KEY_ID found
#    ✓ R2_SECRET_ACCESS_KEY found
#    (or prompt to set them now)
#
# 3. Deploy infrastructure:
#    → Creating R2 bucket "emma-forms"
#    → Deploying API worker to Cloudflare
#    → Creating D1 database "emma-submissions"
#    → Running database migrations
#    → Testing API worker endpoint
#    ✓ Infrastructure deployed successfully!
#
# 4. Save non-secret config to ~/.emma/config.json
#
# Result: Complete setup ready to create and deploy forms

# To reconfigure or switch providers
emma init --override
# This restarts the entire setup process
```

**Form Deployment**

```bash
# Deploy a form (reads credentials from environment)
emma deploy my-form-001

# CLI checks for required environment variables
# Uploads form bundle to R2
# Updates form registry if needed
```

#### Benefits

1. **Security**: No credentials ever stored on disk
2. **CI/CD Friendly**: Environment variables work seamlessly in pipelines
3. **Simple**: One-time infrastructure setup via `emma init`
4. **Multi-Environment**: Easy to switch by changing environment variables
5. **No Secret Management**: Users manage secrets via their preferred tool (shell, .env files, secret managers)

### 2.4 Implementation Checklist

- [ ] Implement environment variable validation in CLI
- [ ] Create `emma init` with provider selection and infrastructure deployment
- [ ] Add R2 S3-compatible client for form uploads
- [ ] Integrate Wrangler for API worker deployment
- [ ] Add database migration runner during init
- [ ] Implement infrastructure health checks
- [ ] Document environment variable setup
- [ ] Add `emma init --override` for reconfiguration

## 3. Form Versioning Strategy

### 3.1 Problem Statement

As forms evolve, we need to track changes and maintain history. However, the approach must be simple and avoid complexity in the CLI and database.

### 3.2 Requirements

- **Simplicity**: Avoid complex version numbering that users must manage
- **History**: Maintain complete history of form changes
- **Deployment**: Each form state should be independently deployable
- **Storage**: Rely on R2 bucket storage, not database
- **No Migrations**: Form changes should not require data migrations

### 3.3 Decision: Linear History with Immutable Form Snapshots

**Core Principle**: Every edit to a form creates a new immutable snapshot that is independently deployable.

#### Versioning Approach

Instead of semantic versioning (MAJOR.MINOR.PATCH), use a **linear history** approach:

1. **Form Identifier**: Each form has a base ID (e.g., `contact-form`)

2. **Snapshot Timestamps**: Each edit creates a new snapshot with timestamp

   ```yaml
   # ~/.emma/forms/contact-form.yaml
   formId: contact-form
   name: Contact Form
   createdAt: 2025-10-01T10:00:00Z
   lastModified: 2025-10-16T14:30:00Z
   currentSnapshot: 1729089000

   snapshots:
     - timestamp: 1727780400 # 2025-10-01 10:00:00
       deployed: true
       r2Key: contact-form-1727780400.js
       changes: Initial version

     - timestamp: 1729089000 # 2025-10-16 14:30:00
       deployed: true
       r2Key: contact-form-1729089000.js
       changes: Added phone number field

   fields:
     # Current field configuration
     - id: name
       type: text
       label: Your Name
       required: true

     - id: email
       type: email
       label: Email Address
       required: true

     - id: phone
       type: tel
       label: Phone Number
       required: false
       addedAt: 1729089000
   ```

3. **R2 Storage Structure**

   Each snapshot is stored independently in R2:

   ```
   emma-forms/
   ├── contact-form-1727780400.js  # Initial version
   ├── contact-form-1729089000.js  # Latest version with phone field
   └── newsletter-1728000000.js
   ```

4. **Form Registry (Lightweight)**

   A simple JSON file in R2 for form discovery:

   ```json
   {
     "forms": [
       {
         "formId": "contact-form",
         "name": "Contact Form",
         "currentSnapshot": 1729089000,
         "allSnapshots": [1727780400, 1729089000],
         "publicUrl": "https://forms.example.com/contact-form-1729089000.js"
       }
     ],
     "lastUpdated": 1729089100
   }
   ```

   Stored at: `emma-forms/registry.json`

#### CLI Workflow

```bash
# Create new form
emma create contact-form
# Creates initial snapshot: contact-form-<timestamp>.yaml

# Edit form (creates new snapshot)
emma edit contact-form
# Interactive prompts to modify fields
# Saves new snapshot in snapshots array
# Updates currentSnapshot

# Build specific snapshot
emma build contact-form
# Builds current snapshot by default

emma build contact-form --snapshot 1727780400
# Builds specific historical snapshot

# Deploy current snapshot
emma deploy contact-form
# Uploads contact-form-<currentSnapshot>.js to R2
# Updates registry.json

# View history
emma history contact-form
# Shows all snapshots with timestamps and changes

# Rollback to previous snapshot
emma deploy contact-form --snapshot 1727780400
# Deploys older version
# Updates currentSnapshot pointer
```

#### Benefits

1. **Simple**: No version number management required
2. **Immutable**: Each snapshot is independently deployable
3. **History**: Complete history maintained in form YAML
4. **Rollback**: Easy to deploy any previous snapshot
5. **No Database**: All version data stored in R2 and local YAML
6. **Parallel Versions**: Can deploy multiple snapshots simultaneously

### 3.4 Implementation Checklist

- [ ] Add snapshot tracking to form YAML schema
- [ ] Implement timestamp-based form bundle naming
- [ ] Create `emma edit` command that generates new snapshots
- [ ] Build `emma history` command to show snapshot timeline
- [ ] Implement `emma deploy --snapshot` for deploying specific versions
- [ ] Create registry.json management in R2
- [ ] Add snapshot comparison tool
- [ ] Document snapshot workflow

## 4. Form Changes and Submissions

### 4.1 Problem Statement

When a form changes (fields added, removed, or modified), what happens to existing submissions? How do we avoid complex migrations?

### 4.2 Requirements

- **Data Preservation**: Never lose existing submission data
- **No Eager Migrations**: Avoid database migrations on form changes
- **Simple Storage**: Use straightforward submission storage
- **Flexible Display**: Show submissions appropriately for their form version

### 4.3 Decision: Create New Forms for Major Changes - No Migrations

**Core Principle**: Instead of migrating data, create new forms for significant changes.

#### Change Management Strategy

1. **Minor Changes (Same Form)**: Non-breaking changes to existing form
   - Label text updates
   - Help text modifications
   - Validation message changes
   - Theme/styling updates
   - **Result**: Edit creates new snapshot of same form

2. **Major Changes (New Form)**: Breaking changes create a new form
   - Removing required fields
   - Changing field types
   - Renaming field IDs
   - Major structural changes
   - **Result**: Use `emma create` to make a new form (e.g., `contact-form-v2`)

#### Submission Storage

Store submissions with reference to the form snapshot used:

```json
{
  "id": "sub_abc123",
  "form_id": "contact-form",
  "form_snapshot": 1729089000,
  "form_bundle": "contact-form-1729089000.js",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123"
  },
  "meta": {
    "timestamp": "2025-10-16T15:00:00Z",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com/contact"
  },
  "created_at": 1729090800
}
```

#### Display Logic

When viewing submissions:

1. **Group by Form**: All submissions for `contact-form` shown together
2. **Indicate Snapshot**: Show which snapshot each submission used
3. **Field Availability**: Display fields that existed in that snapshot
4. **New Fields**: Show as "N/A" if field didn't exist when submitted

Example display:

```
Submission #123 (Form: contact-form-1727780400)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     John Doe
Email:    john@example.com
Phone:    N/A (added in later version)

Submission #456 (Form: contact-form-1729089000)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     Jane Smith
Email:    jane@example.com
Phone:    +1-555-0123
```

#### Benefits

1. **No Migrations**: Never need to migrate submission data
2. **Data Integrity**: All submissions remain exactly as submitted
3. **Clear Separation**: Major changes use new forms, keeping data clean
4. **Simple Logic**: Display layer handles field differences
5. **User Choice**: Users decide whether to create new form or edit existing

### 4.4 Implementation Checklist

- [ ] Store form_snapshot with each submission in API worker
- [ ] Add form_bundle reference for traceability
- [ ] Create submission viewer with snapshot awareness
- [ ] Add grouping by form ID with snapshot indicators
- [ ] Document when to create new forms vs. edit existing
- [ ] Add export functionality that includes snapshot metadata
- [ ] Build form comparison tool to show changes between snapshots

## 5. Summary of Decisions

### 5.1 Authentication Strategy

**Decision**: Environment variables only - no credential storage

**Rationale**:

- Most secure - no credentials on disk
- CI/CD friendly
- Simple - users manage secrets their way
- `emma init` handles complete infrastructure deployment

**Key Implementation**:

- Required env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_API_TOKEN`
- `emma init` deploys API worker, creates database, sets up R2
- `emma init --override` for reconfiguration
- No `emma config` commands needed

### 5.2 Form Versioning

**Decision**: Linear history with timestamp-based immutable snapshots

**Rationale**:

- Simpler than semantic versioning
- No manual version number management
- Each snapshot independently deployable
- Complete history maintained
- All data stored in R2, not database

**Key Implementation**:

- Form snapshots: `contact-form-<timestamp>.js`
- Local form YAML tracks all snapshots
- R2 registry.json for form discovery
- `emma history` shows snapshot timeline
- `emma deploy --snapshot` for rollback

### 5.3 Form Changes

**Decision**: Create new forms for breaking changes - no migrations

**Rationale**:

- Avoids complex migration logic
- Preserves all submission data intact
- Clear separation of concerns
- Users control when to create new forms
- Display layer handles version differences

**Key Implementation**:

- Store form_snapshot with each submission
- Minor changes create new snapshots
- Major changes create new forms (e.g., `contact-form-v2`)
- Submission viewer groups by form, shows snapshot
- No database migrations ever needed

## 6. Impact on Existing Documentation

### 6.1 Documents to Update

1. **[01-project-foundation.md](./01-project-foundation.md)**
   - Remove open questions section
   - Link to this document for decisions

2. **[02-technical-architecture.md](./02-technical-architecture.md)**
   - Update to reflect snapshot-based versioning
   - Remove complex version tables

3. **[docs/infrastructure/cloudflare.md](./infrastructure/cloudflare.md)**
   - Add environment variable setup guide
   - Document `emma init` infrastructure deployment

4. **[docs/developer-guide/cli-reference.md](./developer-guide/cli-reference.md)**
   - Document `emma init` and `emma init --override`
   - Remove `emma config` commands
   - Add `emma history` and snapshot commands

### 6.2 New Documentation Needed

1. **Environment Setup Guide**: How to configure required environment variables
2. **Form History Guide**: Understanding snapshots and when to create new forms
3. **Deployment Guide**: Complete `emma init` to `emma deploy` workflow

## 7. Implementation Roadmap

### Phase 1: Authentication & Infrastructure (Priority: Critical)

- [ ] Implement environment variable validation
- [ ] Create `emma init` with provider selection
- [ ] Add R2 bucket creation
- [ ] Integrate Wrangler for API worker deployment
- [ ] Add D1 database creation and migrations
- [ ] Implement infrastructure health checks
- [ ] Document environment variable setup

**Estimated Effort**: 3-4 days  
**Blocker for**: All deployment features

### Phase 2: Snapshot-Based Versioning (Priority: High)

- [ ] Add snapshot tracking to form schema
- [ ] Implement timestamp-based bundle naming
- [ ] Create `emma edit` with snapshot generation
- [ ] Build `emma history` command
- [ ] Implement registry.json management
- [ ] Add `emma deploy --snapshot`

**Estimated Effort**: 2-3 days  
**Blocker for**: Form management workflow

### Phase 3: Submission Handling (Priority: Medium)

- [ ] Add form_snapshot to submission storage
- [ ] Update API worker to store snapshot reference
- [ ] Create submission viewer with snapshot awareness
- [ ] Add form comparison tool
- [ ] Document form change strategies

**Estimated Effort**: 2-3 days  
**Blocker for**: Long-term form maintenance

## 8. Open Questions (Future Consideration)

- **Multi-provider Support**: How to abstract provider differences?
- **Form Templates**: Should we support form templates with snapshots?
- **Snapshot Cleanup**: Should old snapshots be archived after X months?
- **Submission Migration**: Optional tool to migrate submissions between forms?

These questions are not blockers for v1.0 and can be addressed in future versions.

---

**Status**: ✅ Ready for Implementation  
**Next Steps**: Create GitHub issues for each implementation phase  
**Next Document**: TBD based on implementation needs
