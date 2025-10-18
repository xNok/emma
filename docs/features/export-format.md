# Submission Export Format Guide

**Document Type:** Technical Reference
**Date:** October 18, 2025
**Status:** Final

## Overview

Emma supports exporting form submissions in two formats: **JSON** and **CSV**. Both formats include complete snapshot metadata to ensure data can be properly interpreted.

## Export Endpoint

**Endpoint**: `GET /submissions/export`

**Query Parameters**:

- `format` (optional, default: `json`): Export format (`json` or `csv`)
- `formId` (optional): Filter by form ID
- `snapshot` (optional): Filter by snapshot timestamp

**Response**: File download with appropriate content type and filename

## JSON Format

### Structure

JSON exports provide the most complete representation of submission data, including full metadata and nested structures.

**Example Request**:

```bash
curl https://api.example.com/submissions/export?format=json&formId=contact-form \
  -o submissions.json
```

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
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
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
  },
  {
    "id": "sub_def456uvw",
    "formId": "contact-form",
    "data": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "555-1234",
      "message": "Another test."
    },
    "meta": {
      "timestamp": "2025-10-18T14:30:00Z",
      "userAgent": "Mozilla/5.0...",
      "referrer": "https://example.com/contact",
      "ip": "192.168.1.2"
    },
    "snapshot": {
      "timestamp": 1729189000,
      "bundle": "contact-form-1729189000.js"
    },
    "spamScore": 0,
    "status": "new",
    "createdAt": 1729267800
  }
]
```

### Field Descriptions

| Field                | Type   | Description                                          |
| -------------------- | ------ | ---------------------------------------------------- |
| `id`                 | string | Unique submission identifier                         |
| `formId`             | string | Form ID this submission belongs to                   |
| `data`               | object | Submitted form field values (parsed from JSON)       |
| `meta`               | object | Submission metadata (timestamp, user agent, etc.)    |
| `snapshot.timestamp` | number | Unix timestamp of form snapshot used                 |
| `snapshot.bundle`    | string | Bundle file name for this snapshot                   |
| `spamScore`          | number | Automated spam detection score (0-100)               |
| `status`             | string | Submission status: `new`, `read`, `archived`, `spam` |
| `createdAt`          | number | Unix timestamp when submission was created           |

### Use Cases

JSON format is best for:

- ✅ Programmatic data processing
- ✅ Preserving data types and structures
- ✅ Importing into other systems
- ✅ Analyzing metadata alongside submission data
- ✅ Maintaining exact data representation

## CSV Format

### Structure

CSV exports provide a tabular format suitable for spreadsheet applications and basic data analysis.

**Example Request**:

```bash
curl https://api.example.com/submissions/export?format=csv&formId=contact-form \
  -o submissions.csv
```

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

The value is explicitly set to `"N/A"` to distinguish from:

- Empty strings: `""`
- Null values: (not applicable in CSV)

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

### Use Cases

CSV format is best for:

- ✅ Opening in Excel, Google Sheets, etc.
- ✅ Quick data review and sorting
- ✅ Simple data analysis
- ✅ Importing into databases
- ✅ Generating reports

## Working with Snapshot Metadata

### Understanding Snapshot Columns

Both formats include snapshot information:

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
console.log(date.toISOString()); // "2025-10-16T09:30:00.000Z"
```

**Python**:

```python
from datetime import datetime
date = datetime.fromtimestamp(1729089000)
print(date.isoformat())  # "2025-10-16T09:30:00"
```

**Excel**:

```excel
=DATE(1970,1,1)+A2/86400  # Where A2 contains the timestamp
```

### Analyzing by Snapshot

To analyze submissions by form version:

**SQL** (after importing CSV):

```sql
SELECT
  form_snapshot,
  COUNT(*) as submission_count,
  MIN(created_at) as first_submission,
  MAX(created_at) as last_submission
FROM submissions
GROUP BY form_snapshot
ORDER BY form_snapshot;
```

**Excel Pivot Table**:

1. Import CSV
2. Create Pivot Table
3. Rows: `form_snapshot`
4. Values: Count of `id`

## Export Limits

- **Maximum records**: 1000 submissions per export
- **File size**: Typically < 1MB for JSON, < 500KB for CSV
- **Large exports**: Use pagination with multiple requests

**Example: Large Export**:

```bash
# Export first 1000
curl "https://api.example.com/submissions/export?format=json&formId=contact-form" \
  -o submissions-part1.json

# Export next 1000 (if supported in future)
# Note: Current implementation returns max 1000, pagination TBD
```

## Best Practices

### Choosing a Format

| Need               | Format | Why                                |
| ------------------ | ------ | ---------------------------------- |
| Human review       | CSV    | Easy to open in spreadsheets       |
| Data analysis      | CSV    | Works with Excel, R, Python pandas |
| System integration | JSON   | Preserves data types and structure |
| Backup             | JSON   | Most complete representation       |
| Debugging          | JSON   | Includes all metadata              |

### Regular Exports

For regular data backup:

1. **Automated Schedule**: Export daily/weekly
2. **Version Control**: Include snapshot timestamp in filename
3. **Format**: Use JSON for backups
4. **Storage**: Keep in version-controlled repository

**Example Script**:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
FORM_ID="contact-form"
curl "https://api.example.com/submissions/export?format=json&formId=${FORM_ID}" \
  -o "backups/${FORM_ID}-${DATE}.json"
git add backups/
git commit -m "Backup: ${FORM_ID} ${DATE}"
```

### Data Privacy

When exporting submissions:

1. **PII Handling**: Be aware of personal data in exports
2. **Access Control**: Limit who can export data
3. **Secure Storage**: Encrypt exports containing sensitive data
4. **Retention Policy**: Delete old exports per your policy
5. **GDPR Compliance**: Honor data deletion requests

## Troubleshooting

### Empty Export

**Cause**: No submissions match the filter criteria.

**Solution**: Check formId and snapshot parameters.

### Missing Columns in CSV

**Cause**: Field was added after some submissions were made.

**Solution**: This is expected. Older submissions show "N/A" for new fields.

### Invalid JSON

**Cause**: Network interruption during download.

**Solution**: Re-download the export.

### Excel Date Formatting

**Cause**: Excel doesn't recognize Unix timestamps.

**Solution**: Use conversion formula (see "Converting Snapshot Timestamps" above).

## See Also

- [Submission Viewing Guide](./submission-viewing-guide.md) - Viewing submissions in the API
- [Form Change Strategies](./form-change-strategies.md) - Managing form evolution
- [API Reference](../specs/openapi.yaml) - Complete API documentation
