# Actionable Issues from Architectural Decisions

This document provides ready-to-create GitHub issues based on the architectural decisions in [05-architectural-decisions.md](./05-architectural-decisions.md).

---

## Issue 1: Implement CLI Authentication with R2 S3 API

**Labels:** `enhancement`, `authentication`, `cli`, `deployment`, `priority:critical`

**Description:**

Implement secure authentication for the Emma CLI to deploy forms to Cloudflare R2 using S3-compatible credentials.

**Reference:** [05-architectural-decisions.md - Section 2](./05-architectural-decisions.md#2-authentication-strategy-for-cli-deployment)

**Requirements:**

- [ ] Implement R2 S3-compatible client for uploading form bundles
- [ ] Add credential storage in `~/.emma/config.json` with encryption
- [ ] Support environment variables for CI/CD:
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_ACCOUNT_ID`
- [ ] Create `emma config` commands:
  - `emma config set cloudflare` - Configure Cloudflare authentication
  - `emma config get` - View current configuration (masked)
  - `emma config clear` - Clear stored credentials
- [ ] Add Wrangler CLI integration as fallback method
- [ ] Implement proper error handling for authentication failures
- [ ] Add credential validation during `emma init`

**Testing:**

- [ ] Test R2 upload with S3 credentials
- [ ] Test Wrangler fallback authentication
- [ ] Test credential storage encryption
- [ ] Test environment variable override
- [ ] Test error messages for invalid credentials

**Documentation:**

- [ ] Update `docs/infrastructure/cloudflare.md` with R2 access key setup
- [ ] Update `docs/developer-guide/cli-reference.md` with `emma config` commands
- [ ] Create deployment guide with authentication setup steps
- [ ] Add troubleshooting section for common auth errors

**Acceptance Criteria:**

- CLI can authenticate with R2 using S3 credentials
- Credentials stored securely and never exposed in logs
- Clear error messages guide users through authentication issues
- Works in both local development and CI/CD environments

**Estimated Effort:** 2-3 days

---

## Issue 2: Add Form Schema Versioning

**Labels:** `enhancement`, `schema`, `versioning`, `database`, `priority:high`

**Description:**

Implement semantic versioning for form schemas to track changes and support backwards compatibility.

**Reference:** [05-architectural-decisions.md - Section 3](./05-architectural-decisions.md#3-form-schema-versioning-strategy)

**Requirements:**

- [ ] Add `version` field to form schema (format: MAJOR.MINOR.PATCH)
- [ ] Add `versionHistory` array to track all deployments
- [ ] Add `addedIn` field to individual form fields
- [ ] Create `form_versions` database table:
  ```sql
  CREATE TABLE form_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id TEXT NOT NULL,
    version TEXT NOT NULL,
    schema TEXT NOT NULL,
    changes TEXT,
    deployed_at INTEGER NOT NULL,
    deployed_by TEXT,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE (form_id, version)
  );
  ```
- [ ] Update CLI to detect schema changes and suggest version bumps
- [ ] Add `--version` flag to `emma deploy` command
- [ ] Create `emma versions <form-id>` command to show version history
- [ ] Create `emma diff <form-id> <version1> <version2>` to compare versions

**CLI Behavior:**

When deploying a modified form:
```bash
$ emma deploy cloudflare contact-form-001

⚠️  Schema changes detected:
  - Removed required field "company"
  
This is a BREAKING change.
Current version: 1.2.0
Suggested version: 2.0.0 (major)

? Confirm version 2.0.0? (Y/n)
```

**Testing:**

- [ ] Test version increment detection (major, minor, patch)
- [ ] Test version history storage in database
- [ ] Test version comparison tool
- [ ] Test version rollback capability

**Documentation:**

- [ ] Create version management guide
- [ ] Document version increment rules
- [ ] Add examples of version bump scenarios
- [ ] Update schema documentation with version fields

**Acceptance Criteria:**

- All forms have semantic version numbers
- Complete version history stored in database
- CLI detects and suggests appropriate version bumps
- Developers can view and compare versions

**Estimated Effort:** 3-4 days

---

## Issue 3: Implement Schema-on-Read Migration Support

**Labels:** `enhancement`, `migrations`, `schema`, `database`, `priority:medium`

**Description:**

Implement schema-on-read approach for handling form schema evolution without requiring eager migrations.

**Reference:** [05-architectural-decisions.md - Section 4](./05-architectural-decisions.md#4-schema-migrations-and-field-updates)

**Requirements:**

- [ ] Add `schema_version` field to submissions table:
  ```sql
  ALTER TABLE submissions ADD COLUMN schema_version TEXT DEFAULT '1.0.0';
  CREATE INDEX idx_submissions_schema_version ON submissions(schema_version);
  ```
- [ ] Store schema version with each submission in API worker
- [ ] Create field mappings table for renamed/removed fields:
  ```sql
  CREATE TABLE field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id TEXT NOT NULL,
    from_version TEXT NOT NULL,
    to_version TEXT NOT NULL,
    old_field_id TEXT NOT NULL,
    new_field_id TEXT NOT NULL,
    mapping_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );
  ```
- [ ] Implement schema adapter for reading submissions
- [ ] Add display modes:
  - Current schema view (default)
  - Submission schema view (as originally submitted)
  - Unified view (all fields across versions)
- [ ] Create optional migration commands:
  - `emma migrate <form-id>` - Interactive migration wizard
  - `emma migrate <form-id> --backfill` - Backfill missing fields
  - `emma migrate <form-id> --map "old=new"` - Field renaming

**Schema Mapping Example:**

```yaml
# In form schema for version 2.0.0
fieldMappings:
  - oldId: message
    newId: comments
    deprecatedIn: 2.0.0
    
# Display shows both names for clarity
```

**Testing:**

- [ ] Test submissions with different schema versions
- [ ] Test display with missing fields (new fields added)
- [ ] Test display with deprecated fields (old fields removed)
- [ ] Test field renaming with mappings
- [ ] Test optional backfill migration

**Documentation:**

- [ ] Create migration guide
- [ ] Document migration strategies (no migration, backfill, dual schema)
- [ ] Add examples of handling schema changes
- [ ] Document best practices for schema evolution

**Acceptance Criteria:**

- Submissions store their schema version
- Old submissions display correctly with new schema
- New fields show as "N/A" for old submissions
- Deprecated fields still visible in old submissions
- Optional migration tools available for complex scenarios

**Estimated Effort:** 4-5 days

---

## Issue 4: Update Documentation for Authentication and Versioning

**Labels:** `documentation`, `deployment`, `priority:high`

**Description:**

Create comprehensive documentation for the new authentication, versioning, and migration features.

**Reference:** [05-architectural-decisions.md - Section 6](./05-architectural-decisions.md#6-impact-on-existing-documentation)

**Requirements:**

### New Documentation

- [ ] **Deployment Guide** (`docs/guides/deployment.md`)
  - Step-by-step authentication setup
  - R2 access key generation
  - Environment variable configuration
  - CI/CD integration examples
  
- [ ] **Version Management Guide** (`docs/guides/version-management.md`)
  - Semantic versioning explanation
  - When to bump major/minor/patch
  - Version history tracking
  - Rollback procedures
  
- [ ] **Migration Guide** (`docs/guides/migrations.md`)
  - Schema evolution strategies
  - Handling field additions/removals
  - Field renaming best practices
  - Migration command reference

### Updated Documentation

- [ ] Update `docs/infrastructure/cloudflare.md`
  - Add R2 access key setup section
  - Update wrangler.toml examples
  - Add troubleshooting section
  
- [ ] Update `docs/developer-guide/cli-reference.md`
  - Document `emma config` commands
  - Document `emma versions` command
  - Document `emma migrate` commands
  - Update `emma deploy` with version flag
  
- [ ] Update `docs/developer-guide/form-schemas.md`
  - Add version fields to schema examples
  - Add field mappings examples
  - Document version history structure

- [ ] Update `docs/02-technical-architecture.md`
  - Add new database tables
  - Update schema diagrams
  - Add version flow diagrams

**Acceptance Criteria:**

- Complete, clear documentation for all new features
- Examples and code snippets for common scenarios
- Troubleshooting sections with solutions
- Updated architecture diagrams

**Estimated Effort:** 2-3 days

---

## Issue Priority Order

1. **Issue 1: Authentication** (Critical) - Blocks Cloudflare deployment
2. **Issue 2: Versioning** (High) - Needed for form management
3. **Issue 4: Documentation** (High) - Supports implementation
4. **Issue 3: Migrations** (Medium) - Long-term maintenance feature

**Total Estimated Effort:** 11-15 days

---

## Notes for Implementation

- Issues 1 and 2 can be worked on in parallel after foundational work
- Issue 4 should be completed alongside Issues 1-3 (document as you build)
- Issue 3 can be deferred if needed, but schema_version should be added early
- All database migrations should be created as SQL files in `/migrations/`
- Add comprehensive tests for each feature
- Consider breaking down Issue 3 into smaller sub-issues if needed

---

**Created:** October 16, 2025  
**Source:** [05-architectural-decisions.md](./05-architectural-decisions.md)  
**Status:** Ready for issue creation
