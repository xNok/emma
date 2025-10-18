# Submission Export Format Guide

**Document Type:** Technical Reference
**Date:** October 18, 2025
**Status:** Draft - CLI Implementation Pending

## Overview

Emma will support exporting form submissions in two formats: **JSON** and **CSV**. Both formats will include complete snapshot metadata to ensure data can be properly interpreted.

**Important**: For security reasons, export functionality will be implemented in the Emma CLI rather than exposed through public API endpoints.

## Export via CLI

**Status**: Coming Soon

The Emma CLI will provide secure export commands that access your D1 database directly using Cloudflare credentials.

**Planned Usage**:
```bash
# Export as JSON
emma submissions export <form-id> --format json --output submissions.json

# Export as CSV
emma submissions export <form-id> --format csv --output submissions.csv

# Filter by snapshot
emma submissions export <form-id> --snapshot <timestamp> --format csv
```

## JSON Format

### Structure

JSON exports provide the most complete representation of submission data, including full metadata and nested structures.

**Example Output**:
```json
[
  {
    "id": "sub_abc123xyz",
    "formId": "contact-form",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello, this is a test submission."
    },
    "meta": {
      "timestamp": "2025-10-18T12:00:00Z",
      "userAgent": "Mozilla/5.0...",
      "referrer": "https://example.com/contact",
      "ip": "192.168.1.1"
    },
    "snapshot": {
      "timestamp": 1729089000,
      "bundle": "contact-form-1729089000.js"
    },
    "spamScore": 0,
    "status": "new",
    "createdAt": 1729260000
  }
]
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique submission identifier |
| `formId` | string | Form ID this submission belongs to |
| `data` | object | Submitted form field values |
| `meta` | object | Submission metadata |
| `snapshot.timestamp` | number | Unix timestamp of form snapshot used |
| `snapshot.bundle` | string | Bundle file name for this snapshot |
| `spamScore` | number | Automated spam detection score |
| `status` | string | Submission status |
| `createdAt` | number | Unix timestamp when submission was created |

## CSV Format

### Structure

CSV exports provide a tabular format suitable for spreadsheet applications and basic data analysis.

**Example Output**:
```csv
"id","form_id","created_at","status","spam_score","form_snapshot","form_bundle","name","email","phone","message"
"sub_abc123xyz","contact-form","2025-10-18T12:00:00.000Z","new","0","1729089000","contact-form-1729089000.js","John Doe","john@example.com","N/A","Hello, this is a test submission."
"sub_def456uvw","contact-form","2025-10-18T14:30:00.000Z","new","0","1729189000","contact-form-1729189000.js","Jane Smith","jane@example.com","555-1234","Another test."
```

### Column Structure

**Fixed Columns** (always present):
1. `id` - Submission ID
2. `form_id` - Form ID
3. `created_at` - ISO 8601 timestamp
4. `status` - Submission status
5. `spam_score` - Spam score
6. `form_snapshot` - Snapshot timestamp or "N/A"
7. `form_bundle` - Bundle name or "N/A"

**Dynamic Columns** (vary by form):
- All unique field names from all submissions
- Order is consistent within an export
- Fields appear in the order they were encountered

### Handling Special Cases

#### Missing Fields

When a field doesn't exist in a submission's snapshot:
```csv
"name","email","phone"
"John Doe","john@example.com","N/A"
```

The value is explicitly set to `"N/A"` to distinguish from empty strings.

#### Array Values

Multi-value fields (checkboxes) are joined with semicolons:
```csv
"interests"
"sports; music; reading"
```

#### Special Characters

Values containing special characters are properly escaped:
```csv
"message"
"He said, ""Hello!"" to me."  # Quotes are doubled
```

## Working with Snapshot Metadata

### Understanding Snapshot Columns

Both formats include snapshot information to provide full context:

**In JSON**:
```json
"snapshot": {
  "timestamp": 1729089000,
  "bundle": "contact-form-1729089000.js"
}
```

**In CSV**:
```csv
"form_snapshot","form_bundle"
"1729089000","contact-form-1729089000.js"
```

### Converting Snapshot Timestamps

Snapshot timestamps are Unix timestamps (seconds since epoch):

**JavaScript**:
```javascript
const date = new Date(1729089000 * 1000);
console.log(date.toISOString());
```

**Python**:
```python
from datetime import datetime
date = datetime.fromtimestamp(1729089000)
print(date.isoformat())
```

## Best Practices

### Choosing a Format

| Need | Format | Why |
|------|--------|-----|
| Human review | CSV | Easy to open in spreadsheets |
| Data analysis | CSV | Works with Excel, R, Python pandas |
| System integration | JSON | Preserves data types and structure |
| Backup | JSON | Most complete representation |
| Debugging | JSON | Includes all metadata |

### Security Considerations

When exporting submissions:

1. **PII Handling**: Be aware of personal data in exports
2. **Access Control**: Only authenticated CLI users can export
3. **Secure Storage**: Encrypt exports containing sensitive data
4. **Retention Policy**: Delete old exports per your policy
5. **GDPR Compliance**: Honor data deletion requests

## See Also

- [Submission Viewing Guide](./submission-viewing-guide.md) - Overview of submission handling
- [Form Change Strategies](./form-change-strategies.md) - Managing form evolution
- [CLI Command Reference](../user-guide/cli-command-reference.md) - Complete CLI documentation
