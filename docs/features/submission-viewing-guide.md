# Submission Viewing Guide

**Document Type:** User Guide
**Date:** October 18, 2025
**Status:** Draft - CLI Implementation Pending

## Overview

This guide explains how to view and manage form submissions in the Emma system, with a focus on understanding how form snapshots affect submission display and data integrity.

**Important**: For security reasons, submission viewing and export functionality is implemented in the Emma CLI rather than exposed through public API endpoints. The API worker only handles form submission storage.

## Key Concepts

### Snapshot-Aware Submissions

Every submission in Emma is tagged with the form snapshot that was active when the submission was made. This ensures that:

1. **Data Integrity**: Submissions are always displayed with the correct field structure
2. **No Migrations**: Form schema changes never require data migrations
3. **Historical Accuracy**: You can see submissions exactly as they were submitted
4. **Version Tracking**: Easy to identify which form version collected which data

### Submission Metadata

Each submission includes:

- **Submission ID**: Unique identifier for the submission
- **Form ID**: Which form the submission belongs to
- **Data**: The actual form field values
- **Metadata**: Timestamp, user agent, referrer, IP address
- **Form Snapshot**: Unix timestamp of the form snapshot used
- **Form Bundle**: Bundle file name (e.g., `contact-form-1729089000.js`)
- **Status**: `new`, `read`, `archived`, or `spam`
- **Spam Score**: Automated spam detection score

## Viewing Submissions via CLI

**Status**: Coming Soon

The Emma CLI will provide commands to securely view and export submissions directly from the D1 database using your Cloudflare credentials.

### Planned Commands

**List submissions**:
```bash
emma submissions list <form-id>
```

**Filter by snapshot**:
```bash
emma submissions list <form-id> --snapshot <timestamp>
```

**Export to CSV**:
```bash
emma submissions export <form-id> --format csv --output submissions.csv
```

**Export to JSON**:
```bash
emma submissions export <form-id> --format json --output submissions.json
```

**Compare snapshots**:
```bash
emma forms compare <form-id> <snapshot1> <snapshot2>
```

## Handling Missing Fields

### The "N/A" Pattern

When a field exists in a newer snapshot but not in an older one (or vice versa), the export will display "N/A" for that field value.

**Example Scenario**:

1. **Snapshot 1** (October 10): Form has fields: `name`, `email`
2. **Snapshot 2** (October 15): Form adds field: `phone`

**Viewing Submissions**:
- Submissions from Snapshot 1 will show: `phone: N/A`
- Submissions from Snapshot 2 will show all three fields

This approach:
- ✅ Preserves original submission data
- ✅ Makes missing fields explicit
- ✅ Avoids confusion about incomplete data
- ✅ No database migrations required

## Database Storage

Submissions are stored in the D1 database with the following schema:

```sql
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  data TEXT NOT NULL,              -- JSON of submitted data
  meta TEXT,                        -- JSON metadata
  spam_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  created_at INTEGER NOT NULL,
  form_snapshot INTEGER,            -- Unix timestamp of form snapshot
  form_bundle TEXT,                 -- Bundle file name
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
```

## Security

- Submissions are **only** accessible through authenticated CLI commands
- No public API endpoints expose submission data
- Cloudflare credentials are required for all access
- Data is stored securely in your Cloudflare D1 database

## See Also

- [Export Format Guide](./export-format.md) - Details on exporting submission data
- [Form Change Strategies](./form-change-strategies.md) - When to edit vs. create new forms
- [Snapshot Versioning](../user-guide/form-schema-versioning.md) - Understanding form snapshots
- [CLI Command Reference](../user-guide/cli-command-reference.md) - Managing forms and snapshots
