# Architectural Decisions

**Document Number:** 05  
**Date:** October 16, 2025  
**Status:** Final  
**Previous:** [04-api-worker-architecture.md](./04-api-worker-architecture.md)

## 1. Purpose

This document formally addresses the open architectural questions from [01-project-foundation.md](./01-project-foundation.md) that are required for v1.0 release. These decisions establish clear technical approaches for CLI authentication, schema versioning, and database migrations.

## 2. Authentication Strategy for CLI Deployment

### 2.1 Problem Statement

The Form Builder CLI needs to securely authenticate with Cloudflare services to deploy forms to R2 storage and register forms in the D1 database. This is a blocker for implementing the deployment feature.

### 2.2 Requirements

- **Security**: Credentials must be stored securely and not exposed in repositories
- **Simplicity**: Easy setup for developers with minimal configuration
- **Flexibility**: Support different environments (development, staging, production)
- **Least Privilege**: Use minimal required permissions for API access
- **Revocability**: Ability to revoke access without affecting other services

### 2.3 Decision: Scoped API Token with S3-Compatible R2 Access

**Primary Method: R2 S3-Compatible Credentials (Recommended)**

For production deployments, use Cloudflare R2's S3-compatible API with access keys:

1. **R2 Access Keys**
   - Generate R2-specific API tokens from Cloudflare Dashboard
   - Provides S3-compatible access to R2 buckets
   - Does not require full Cloudflare API access

2. **Configuration Storage**

   ```bash
   # Environment variables (recommended for CI/CD)
   export R2_ACCESS_KEY_ID="your-access-key-id"
   export R2_SECRET_ACCESS_KEY="your-secret-access-key"
   export R2_ACCOUNT_ID="your-cloudflare-account-id"

   # Or stored in ~/.emma/config.json (encrypted)
   {
     "cloudflare": {
       "accountId": "your-account-id",
       "r2": {
         "accessKeyId": "encrypted-value",
         "secretAccessKey": "encrypted-value",
         "bucketName": "emma-forms",
         "publicUrl": "https://forms.example.com"
       }
     }
   }
   ```

3. **Token Permissions Required**
   - R2 Bucket: Read & Write access
   - No other Cloudflare API permissions needed

4. **CLI Flow**

   ```bash
   # Initial setup
   emma init
   # Prompts for:
   # - Cloudflare Account ID
   # - R2 Access Key ID
   # - R2 Secret Access Key
   # - R2 Bucket Name
   # - Public CDN URL

   # Deploy using stored credentials
   emma deploy cloudflare my-form-001

   # Or override with flags
   emma deploy cloudflare my-form-001 \
     --access-key-id $R2_ACCESS_KEY_ID \
     --secret-access-key $R2_SECRET_ACCESS_KEY \
     --bucket emma-forms
   ```

**Alternative Method: Wrangler CLI Integration (Fallback)**

For developers already using Wrangler:

1. **Use Wrangler Authentication**
   - Leverage existing `wrangler login` or `CLOUDFLARE_API_TOKEN`
   - Automatically uses Wrangler's stored credentials
   - Falls back to this method if R2 credentials not configured

2. **Configuration**

   ```bash
   # Authenticate with Wrangler
   npx wrangler login

   # Or use API token
   export CLOUDFLARE_API_TOKEN="your-api-token"
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"

   # Emma CLI will detect and use Wrangler credentials
   emma deploy cloudflare my-form-001
   ```

3. **Token Permissions Required**
   - Account - Workers R2 Storage: Edit
   - Account - D1: Edit (if registering forms)

### 2.4 Security Best Practices

1. **Credential Storage**
   - Store in `~/.emma/config.json` with file permissions 600
   - Encrypt sensitive values using system keychain when available
   - Never commit credentials to git repositories

2. **Environment Variables**
   - Recommended for CI/CD pipelines
   - Prefix with `R2_` or `CLOUDFLARE_` for clarity
   - Document required variables in deployment guides

3. **Token Scoping**
   - Create separate tokens for development and production
   - Use bucket-specific policies when possible
   - Set token expiration dates (e.g., 90 days)

4. **Revocation Process**
   - Document how to revoke and regenerate tokens
   - Provide CLI command to clear stored credentials: `emma config clear`

### 2.5 Implementation Checklist

- [ ] Implement R2 S3-compatible client in CLI
- [ ] Add credential encryption for config.json storage
- [ ] Create `emma config` commands for managing authentication
- [ ] Add Wrangler fallback authentication method
- [ ] Document setup process in deployment guide
- [ ] Add error messages for authentication failures
- [ ] Create troubleshooting guide for common auth issues

## 3. Form Schema Versioning Strategy

### 3.1 Problem Statement

As forms evolve, the schema structure may change. We need a clear versioning strategy to:

- Track changes to individual forms
- Ensure backwards compatibility
- Handle schema validation over time
- Support form rollback if needed

### 3.2 Requirements

- **Change Tracking**: Record what changed and when
- **Backwards Compatibility**: Existing submissions remain valid
- **Deployment Safety**: Prevent breaking changes
- **Developer Experience**: Simple versioning workflow
- **Audit Trail**: History of form modifications

### 3.3 Decision: Semantic Versioning with Immutable Deployments

**Version Format**: Follow Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH

Examples:
- 1.0.0 - Initial deployment
- 1.1.0 - Added optional email field
- 1.0.1 - Fixed validation message typo
- 2.0.0 - Removed required name field (breaking change)
```

**Version Increment Rules**:

1. **MAJOR** (Breaking Changes)
   - Removing a required field
   - Changing field type (e.g., text → number)
   - Changing field ID
   - Modifying validation that makes existing data invalid

2. **MINOR** (Additive Changes)
   - Adding new optional fields
   - Adding new validation to optional fields
   - Changing labels or help text
   - Modifying non-breaking UI settings

3. **PATCH** (Non-Functional Changes)
   - Fixing typos in labels
   - Adjusting CSS/themes
   - Updating success messages
   - Performance improvements

**Schema Structure**:

```yaml
formId: contact-form-001
name: Contact Form
# Current version
version: 1.2.0
# Track all versions
versionHistory:
  - version: 1.0.0
    deployedAt: 2025-10-01T10:00:00Z
    changes: Initial release
  - version: 1.1.0
    deployedAt: 2025-10-08T15:30:00Z
    changes: Added optional company field
  - version: 1.2.0
    deployedAt: 2025-10-16T12:00:00Z
    changes: Added phone number field with validation

fields:
  - id: name
    type: text
    label: Your Name
    required: true
    # Track when field was added
    addedIn: 1.0.0
```

**CLI Workflow**:

```bash
# Editing a form prompts for version bump
emma edit contact-form-001
# CLI detects changes and suggests version bump:
# "You removed a required field. Suggested version: 2.0.0 (major)"

# Manual version specification
emma deploy cloudflare contact-form-001 --version 1.2.0

# View version history
emma versions contact-form-001
```

### 3.4 Version Storage in Database

**Forms Table Enhancement**:

```sql
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schema TEXT NOT NULL,           -- Current schema JSON
  version TEXT NOT NULL,           -- Current version (e.g., "1.2.0")
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  active INTEGER DEFAULT 1
);

-- New table for version history
CREATE TABLE form_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id TEXT NOT NULL,
  version TEXT NOT NULL,           -- Version number
  schema TEXT NOT NULL,            -- Full schema snapshot at this version
  changes TEXT,                    -- Description of changes
  deployed_at INTEGER NOT NULL,    -- Deployment timestamp
  deployed_by TEXT,                -- User/system that deployed
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  UNIQUE (form_id, version)
);

CREATE INDEX idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX idx_form_versions_deployed_at ON form_versions(deployed_at DESC);
```

### 3.5 Benefits

1. **Clear Change Communication**: Developers know impact of changes
2. **Rollback Capability**: Can revert to previous versions
3. **Audit Trail**: Complete history of form modifications
4. **Safety**: Major version bump signals breaking changes
5. **Compatibility**: Semantic versioning is industry standard

## 4. Schema Migrations and Field Updates

### 4.1 Problem Statement

When a form schema changes:

- What happens to existing submissions with old schema?
- How do we display old data with new form structure?
- How do we handle removed or renamed fields?
- Should we validate old submissions against new schema?

### 4.2 Requirements

- **Data Preservation**: Never lose existing submission data
- **Schema Evolution**: Support adding/removing fields safely
- **Query Compatibility**: Allow querying across schema versions
- **Display Consistency**: Show old submissions meaningfully
- **Performance**: Migrations should not block deployments

### 4.3 Decision: Schema-on-Read with Version Tagging

**Core Principle**: Store submissions with their schema version and adapt on read.

**Submission Storage**:

```json
{
  "id": "sub_abc123",
  "form_id": "contact-form-001",
  "schema_version": "1.0.0",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  },
  "meta": {
    "timestamp": "2025-10-16T10:00:00Z",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com/contact"
  },
  "created_at": 1697454000
}
```

Note: `schema_version` stores the schema version at submission time.

**Reading Submissions with Schema Mapping**:

When displaying submissions:

1. **Fetch submission with schema_version**
2. **Load current form schema**
3. **Apply field mapping rules**:
   - **New fields**: Show as "N/A" or "Not collected"
   - **Removed fields**: Still display with "(deprecated)" label
   - **Renamed fields**: Use mapping table to show both names
   - **Type changes**: Convert or show warning

**Example Schema Evolution**:

```yaml
# Version 1.0.0 → 1.1.0: Added optional phone field
# Old submissions: phone field shows "N/A"
# New submissions: phone field has data

# Version 1.1.0 → 2.0.0: Renamed "message" to "comments"
# Mapping in schema:
fieldMappings:
  - oldId: message
    newId: comments
    deprecatedIn: 2.0.0
# Display logic:
# - Show old submissions with "comments (was: message)"
# - New submissions use "comments" field
```

### 4.4 Migration Strategies

**Strategy 1: No Migration (Default)**

- Submissions remain unchanged
- Schema version stored with each submission
- Display layer handles differences
- **Best for**: Most forms, especially those with additive changes

**Strategy 2: Backfill Migration (Optional)**

For breaking changes, optionally backfill data:

```bash
# CLI command to backfill missing fields
emma migrate contact-form-001 \
  --from 1.0.0 \
  --to 2.0.0 \
  --map "message=comments" \
  --default-value "phone=N/A"

# This updates old submissions to match new schema
```

**Strategy 3: Dual Schema Support**

For critical forms, maintain dual schemas temporarily:

```yaml
# During transition period, support both schemas
schemaCompat:
  - version: 1.0.0
    validUntil: 2026-01-01
  - version: 2.0.0
    validFrom: 2025-10-16
# Submissions validated against appropriate schema
```

### 4.5 Database Schema Enhancement

```sql
-- Add schema_version to submissions table
ALTER TABLE submissions ADD COLUMN schema_version TEXT DEFAULT '1.0.0';

-- Add index for querying by schema version
CREATE INDEX idx_submissions_schema_version ON submissions(schema_version);

-- Field mappings table for complex migrations
CREATE TABLE field_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id TEXT NOT NULL,
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  old_field_id TEXT NOT NULL,
  new_field_id TEXT NOT NULL,
  mapping_type TEXT NOT NULL,     -- 'rename', 'merge', 'split', 'remove'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
```

### 4.6 Display Rules

**Admin Dashboard / Submission Viewer**:

1. **Current Schema View** (Default)
   - Show all fields from current schema
   - Mark missing fields as "Not collected"
   - Group submissions by schema version

2. **Submission Schema View**
   - Show fields as they were when submitted
   - Include deprecated fields
   - Add timestamp of schema version

3. **Unified View** (Advanced)
   - Merge all fields across versions
   - Show data availability per submission
   - Export functionality includes all fields

**Example Display**:

```
Submission #123 (Schema v1.0.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     John Doe
Email:    john@example.com
Message:  Hello!
Phone:    N/A (added in v1.1.0)
Company:  N/A (added in v2.0.0)

Submission #456 (Schema v2.0.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     Jane Smith
Email:    jane@example.com
Comments: Great service! (was: Message)
Phone:    +1-555-0123
Company:  Acme Corp
```

### 4.7 Implementation Checklist

- [ ] Add schema_version field to submissions table
- [ ] Store version with each submission in API worker
- [ ] Create form_versions table for version history
- [ ] Implement schema-on-read adapter in submission viewer
- [ ] Add field mapping support for renamed fields
- [ ] Create migration CLI commands
- [ ] Document migration strategies for users
- [ ] Add version comparison tool to CLI
- [ ] Build submission export with schema evolution support

## 5. Summary of Decisions

### 5.1 Authentication Strategy

**Decision**: Use R2 S3-compatible credentials as primary method, with Wrangler integration as fallback.

**Rationale**:

- Most secure and least privileged approach
- Standard S3 interface is well-documented
- Does not require full Cloudflare API access
- Works in CI/CD environments easily

### 5.2 Schema Versioning

**Decision**: Semantic versioning with immutable deployments and version history tracking.

**Rationale**:

- Industry-standard versioning approach
- Clear communication of change impact
- Enables rollback and audit trails
- Supports backwards compatibility analysis

### 5.3 Schema Migrations

**Decision**: Schema-on-read with version tagging, avoiding eager migrations.

**Rationale**:

- Preserves all historical data
- No migration downtime on deployments
- Flexible display options for different needs
- Optional migration for special cases
- Aligns with event sourcing principles

## 6. Impact on Existing Documentation

### 6.1 Documents to Update

1. **[01-project-foundation.md](./01-project-foundation.md)**
   - Remove open questions section
   - Link to this document for decisions

2. **[02-technical-architecture.md](./02-technical-architecture.md)**
   - Update database schema with new tables
   - Add version fields to form schema

3. **[docs/infrastructure/cloudflare.md](./infrastructure/cloudflare.md)**
   - Add detailed authentication setup guide
   - Include R2 access key generation steps

4. **[docs/developer-guide/cli-reference.md](./developer-guide/cli-reference.md)**
   - Document version commands
   - Add migration command reference

### 6.2 New Documentation Needed

1. **Deployment Guide**: Step-by-step authentication setup
2. **Migration Guide**: How to handle schema changes
3. **Version Management Guide**: Best practices for versioning

## 7. Implementation Roadmap

### Phase 1: Authentication (Priority: Critical)

- [ ] Implement R2 S3 client with credential management
- [ ] Add `emma config` commands for authentication
- [ ] Create setup wizard in `emma init`
- [ ] Document authentication process
- [ ] Add error handling and troubleshooting

**Estimated Effort**: 2-3 days  
**Blocker for**: Cloudflare deployment feature

### Phase 2: Schema Versioning (Priority: High)

- [ ] Add version field to form schema
- [ ] Create form_versions database table
- [ ] Update CLI to track version history
- [ ] Add version increment prompts to `emma edit`
- [ ] Implement version comparison tool

**Estimated Effort**: 3-4 days  
**Blocker for**: Form editing workflow

### Phase 3: Schema Migrations (Priority: Medium)

- [ ] Add schema_version to submissions
- [ ] Implement schema-on-read adapter
- [ ] Create submission viewer with version awareness
- [ ] Add optional migration commands
- [ ] Document migration strategies

**Estimated Effort**: 4-5 days  
**Blocker for**: Long-term form maintenance

## 8. Open Questions (Future Consideration)

- **Multi-tenant Isolation**: How to separate forms across organizations?
- **Form Templates**: Should we support form templates with versioning?
- **Schema Validation**: Should we validate old submissions against new schema?
- **Data Retention**: What's the policy for old submission data?
- **Form Archival**: How to handle deprecated forms?

These questions are not blockers for v1.0 and can be addressed in future versions.

---

**Status**: ✅ Ready for Implementation  
**Next Steps**: Create actionable GitHub issues for each phase  
**Next Document**: TBD based on implementation needs
