# Submission Viewing Guide

**Document Type:** User Guide
**Date:** October 18, 2025
**Status:** Final

## Overview

This guide explains how to view and manage form submissions in the Emma system, with a focus on understanding how form snapshots affect submission display and data integrity.

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

## Viewing Submissions

### List All Submissions

**Endpoint**: `GET /submissions`

Retrieves all submissions with optional filtering and pagination.

**Query Parameters**:
- `formId` (optional): Filter by form ID
- `snapshot` (optional): Filter by snapshot timestamp
- `limit` (optional, default: 50, max: 100): Results per page
- `offset` (optional, default: 0): Pagination offset

**Example Request**:
```bash
curl https://api.example.com/submissions?formId=contact-form&limit=20
```

**Example Response**:
```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub_abc123xyz",
      "form_id": "contact-form",
      "data": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
      "meta": "{\"timestamp\":\"2025-10-18T12:00:00Z\",\"ip\":\"192.168.1.1\"}",
      "spam_score": 0,
      "status": "new",
      "created_at": 1729260000,
      "form_snapshot": 1729089000,
      "form_bundle": "contact-form-1729089000.js"
    }
  ],
  "grouped": {
    "contact-form": {
      "formId": "contact-form",
      "snapshots": {
        "1729089000": {
          "snapshot": 1729089000,
          "bundle": "contact-form-1729089000.js",
          "count": 15,
          "submissions": [...]
        },
        "1729189000": {
          "snapshot": 1729189000,
          "bundle": "contact-form-1729189000.js",
          "count": 8,
          "submissions": [...]
        }
      }
    }
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 23
  }
}
```

### Filter by Snapshot

To view only submissions from a specific form version:

```bash
curl https://api.example.com/submissions?formId=contact-form&snapshot=1729089000
```

This is useful when:
- Analyzing data from before a form change
- Comparing submission patterns across versions
- Troubleshooting issues with specific form versions

### Understanding Grouped Data

The `grouped` object in the response organizes submissions by:
1. **Form ID**: Top-level grouping
2. **Snapshot**: Second-level grouping within each form

This structure makes it easy to:
- See how many submissions each snapshot received
- Compare submission volumes across form versions
- Identify which snapshots are most active

## Handling Missing Fields

### The "N/A" Pattern

When a field exists in a newer snapshot but not in an older one (or vice versa), the system displays "N/A" for that field value.

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

### Best Practices for Display

When building a submission viewer UI:

1. **Show Snapshot Information**: Always display which snapshot a submission came from
2. **Distinguish N/A**: Style N/A values differently from empty strings
3. **Group by Snapshot**: Use the grouped data to organize the display
4. **Provide Context**: Show what fields were available in each snapshot

**Example UI Layout**:
```
Form: Contact Form (contact-form)

📸 Snapshot: 1729089000 (October 10, 2025) - 15 submissions
┌─────────────────────────────────────────┐
│ Name          Email              Phone  │
│ John Doe      john@example.com   N/A    │
│ Jane Smith    jane@example.com   N/A    │
└─────────────────────────────────────────┘

📸 Snapshot: 1729189000 (October 15, 2025) - 8 submissions
┌─────────────────────────────────────────────────────┐
│ Name          Email              Phone           │
│ Bob Johnson   bob@example.com    555-1234       │
│ Alice Brown   alice@example.com  555-5678       │
└─────────────────────────────────────────────────────┘
```

## Advanced Viewing Features

### Snapshot Comparison

Compare two form snapshots to see what changed:

**Endpoint**: `GET /forms/:formId/compare?snapshot1=<ts1>&snapshot2=<ts2>`

**Example Request**:
```bash
curl https://api.example.com/forms/contact-form/compare?snapshot1=1729089000&snapshot2=1729189000
```

**Example Response**:
```json
{
  "success": true,
  "formId": "contact-form",
  "snapshot1": {
    "timestamp": 1729089000,
    "bundle": "contact-form-1729089000.js",
    "fieldCount": 2
  },
  "snapshot2": {
    "timestamp": 1729189000,
    "bundle": "contact-form-1729189000.js",
    "fieldCount": 3
  },
  "changes": {
    "added": [
      {
        "fieldId": "phone",
        "type": "added",
        "newField": {
          "id": "phone",
          "type": "tel",
          "label": "Phone Number"
        }
      }
    ],
    "removed": [],
    "modified": []
  },
  "summary": {
    "totalChanges": 1,
    "addedCount": 1,
    "removedCount": 0,
    "modifiedCount": 0
  }
}
```

### Export Submissions

See the [Export Format Guide](./export-format.md) for details on exporting submission data.

## Troubleshooting

### Submission Shows Unexpected N/A Values

**Cause**: The form was edited after the submission was made.

**Solution**: 
1. Check the submission's `form_snapshot` timestamp
2. Compare with the form's snapshot history using `emma history <form-id>`
3. The field may have been added or removed in a later snapshot

### Cannot Find Submissions

**Cause**: Filtering by wrong snapshot or form ID.

**Solution**:
1. List all snapshots: `emma history <form-id>`
2. List submissions without filters: `GET /submissions?formId=<form-id>`
3. Check the `grouped` response to see available snapshots

### Mixed Field Sets in UI

**Cause**: Displaying submissions from multiple snapshots together.

**Solution**: Use snapshot grouping from the API response to organize display by version.

## See Also

- [Export Format Guide](./export-format.md) - Details on exporting submission data
- [Form Change Strategies](./form-change-strategies.md) - When to edit vs. create new forms
- [Snapshot Versioning](../user-guide/form-schema-versioning.md) - Understanding form snapshots
- [CLI Command Reference](../user-guide/cli-command-reference.md) - Managing forms and snapshots
