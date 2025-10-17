# Form History Guide

This guide explains Emma's snapshot-based versioning system and helps you decide when to edit existing forms versus creating new ones.

## Overview

Emma uses **snapshot-based versioning** instead of traditional semantic versioning (like 1.0.0, 1.1.0, etc.). Every time you edit a form, Emma creates a new immutable snapshot with a timestamp. This approach:

- **Eliminates version number management** - No need to decide between MAJOR, MINOR, or PATCH
- **Maintains complete history** - Every change is tracked and can be rolled back
- **Enables independent deployments** - Each snapshot can be deployed separately
- **Simplifies storage** - All version data lives in R2 and local YAML, not in a database

## Understanding Snapshots

### What is a Snapshot?

A snapshot is an immutable copy of your form at a specific point in time. Each snapshot includes:

- **Timestamp**: Unix timestamp (e.g., `1729089000`) representing when it was created
- **Form Configuration**: Complete field definitions, settings, and theme
- **Deployment Info**: Whether it's deployed and the R2 key
- **Change Description**: Summary of what changed

### Example Form History

```yaml
formId: contact-form
name: Contact Form
currentSnapshot: 1729089000

snapshots:
  - timestamp: 1727780400 # 2025-10-01 10:00:00
    deployed: true
    storageKey: contact-form-1727780400.js
    changes: Initial version

  - timestamp: 1728900000 # 2025-10-14 08:00:00
    deployed: true
    storageKey: contact-form-1728900000.js
    changes: Updated success message

  - timestamp: 1729089000 # 2025-10-16 14:30:00
    deployed: true
    storageKey: contact-form-1729089000.js
    changes: Added phone number field
```

## When to Edit vs. Create New Form

### Edit Existing Form (Creates New Snapshot)

Use `emma edit <form-id>` for **non-breaking changes** that won't affect existing submissions:

✅ **Safe Changes:**

- Adding optional fields
- Updating field labels or help text
- Changing validation messages
- Modifying success/error messages
- Updating submit button text
- Theme or styling changes
- Adding new field validations (for new submissions)
- Changing field order

**Example:**

```bash
# Your contact form has: name, email, message
# You want to add an optional phone field

emma edit contact-form
# Select "Add new field" → Add phone field
# New snapshot created: 1729089000
```

**Result:**

- Old submissions still display correctly (phone shows as N/A)
- New submissions include phone field
- Form URL remains the same
- All existing integrations keep working

### Create New Form

Use `emma create <new-form-name>` for **breaking changes** that would affect how old submissions display:

⚠️ **Breaking Changes:**

- Removing required fields
- Changing field types (e.g., text → number)
- Renaming field IDs
- Major structural changes
- Completely different form purpose

**Example:**

```bash
# Your contact form has: name, email, message
# You want to remove the message field (breaking!)

# Don't edit - create new form instead
emma create contact-form-v2
# Configure fields: name, email (no message)
```

**Result:**

- Old form (`contact-form`) still works for existing uses
- New form (`contact-form-v2`) has the new structure
- Old submissions remain intact and fully viewable
- You choose when to update your website to use the new form

### Decision Tree

```
Do you need to change the form?
│
├─ Adding optional fields? → Edit existing form
├─ Updating text/labels? → Edit existing form
├─ Changing styling/theme? → Edit existing form
├─ Reordering fields? → Edit existing form
│
├─ Removing required fields? → Create new form
├─ Changing field types? → Create new form
├─ Renaming field IDs? → Create new form
└─ Major structural change? → Create new form
```

## Working with Snapshots

### Viewing Form History

```bash
emma history contact-form
```

**Output:**

```
📋 Form History: Contact Form

Current snapshot: 1729089000 (2025-10-16 14:30:00)

Snapshots (newest first):

  1729089000 - 2025-10-16 14:30:00 ✓ Deployed
  Changes: Added phone number field
  Bundle: contact-form-1729089000.js
  Fields: name, email, phone, message
  Submissions: 30

  1728900000 - 2025-10-14 08:00:00 ✓ Deployed
  Changes: Updated success message
  Bundle: contact-form-1728900000.js
  Fields: name, email, message
  Submissions: 10

  1727780400 - 2025-10-01 10:00:00 ✓ Deployed
  Changes: Initial version
  Bundle: contact-form-1727780400.js
  Fields: name, email, message
  Submissions: 5

Total snapshots: 3
Total submissions: 45
```

### Creating a New Snapshot

Edit your form to create a new snapshot:

```bash
emma edit contact-form
```

Follow the interactive prompts to modify fields, then save. Emma automatically:

1. Creates new snapshot with current timestamp
2. Updates `currentSnapshot` pointer
3. Preserves complete history
4. Tracks which fields were added/removed/modified

### Building a Specific Snapshot

```bash
# Build current snapshot
emma build contact-form

# Build specific historical snapshot
emma build contact-form --snapshot 1727780400
```

### Deploying Snapshots

```bash
# Deploy current snapshot
emma deploy contact-form

# Deploy (or rollback to) specific snapshot
emma deploy contact-form --snapshot 1727780400
```

## Snapshot Storage

### Local Storage

Form configurations with snapshot history are stored in `~/.emma/forms/`:

```
~/.emma/forms/
├── contact-form.yaml           # Full history included
├── newsletter-signup.yaml
└── survey-form.yaml
```

### R2 Storage

Each deployed snapshot gets its own bundle in R2:

```
emma-forms/
├── contact-form-1727780400.js  # Snapshot 1
├── contact-form-1728900000.js  # Snapshot 2
├── contact-form-1729089000.js  # Snapshot 3 (current)
├── registry.json               # Form discovery
```

### Form Registry

Emma maintains a lightweight registry in R2 for form discovery:

```json
{
  "forms": [
    {
      "formId": "contact-form",
      "name": "Contact Form",
      "currentSnapshot": 1729089000,
      "allSnapshots": [1727780400, 1728900000, 1729089000],
      "publicUrl": "https://forms.example.com/contact-form-1729089000.js"
    }
  ],
  "lastUpdated": 1729089100
}
```

## Submission Tracking

### How Submissions Track Snapshots

Each submission includes metadata about which snapshot was used:

```json
{
  "id": "sub_abc123",
  "form_id": "contact-form",
  "form_snapshot": 1729089000,
  "form_bundle": "contact-form-1729089000.js",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "message": "Hello!"
  },
  "created_at": 1729090800
}
```

### Viewing Submissions Across Snapshots

When viewing submissions, Emma groups them by form and shows which snapshot each used:

```
Submissions for: Contact Form

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submission #456 - 2025-10-16 15:00:00
Snapshot: 1729089000 (Current)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     Jane Smith
Email:    jane@example.com
Phone:    +1-555-0123
Message:  Looking forward to connecting!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submission #123 - 2025-10-05 12:30:00
Snapshot: 1727780400 (Initial)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     John Doe
Email:    john@example.com
Phone:    N/A (field added in later version)
Message:  Hello there!
```

### No Migration Needed

Because submissions include snapshot information:

- Old submissions display correctly even as forms evolve
- New fields show "N/A" for old submissions
- No database migrations required
- All data preserved exactly as submitted

## Common Workflows

### Workflow 1: Adding a Field

```bash
# Current form has: name, email, message
# Want to add: phone (optional)

emma edit contact-form
# → Add phone field as optional
# → Save changes

emma build contact-form
emma deploy contact-form

# Old submissions: phone = N/A
# New submissions: phone = (value provided)
```

### Workflow 2: Fixing a Typo

```bash
# Noticed "Email Adress" instead of "Email Address"

emma edit contact-form
# → Edit email field
# → Fix label: "Email Address"
# → Save changes

emma build contact-form
emma deploy contact-form

# New snapshot created with corrected label
```

### Workflow 3: Major Redesign

```bash
# Want to completely restructure the form
# Current: name, email, message
# New design: firstName, lastName, email, company, role, message

# Don't edit! Create new form instead
emma create contact-form-v2

# Configure all new fields
# Build and deploy
emma build contact-form-v2
emma deploy contact-form-v2

# Update website to use new form:
# {{< embed-form "contact-form-v2" >}}

# Old form still works, old submissions intact
```

### Workflow 4: Rolling Back

```bash
# Deployed a new snapshot but users report issues

# Check history
emma history contact-form
# Current: 1729089000 (has issues)
# Previous: 1728900000 (was working)

# Rollback to previous snapshot
emma deploy contact-form --snapshot 1728900000

# Form now uses previous version
# Fix issues in local YAML
# Create new snapshot when ready
```

### Workflow 5: A/B Testing

```bash
# Test two versions simultaneously

# Current snapshot: 1729089000 (Version A)
emma deploy contact-form --snapshot 1729089000

# Test snapshot: 1729090000 (Version B)
emma deploy contact-form --snapshot 1729090000

# Both versions are live with different bundles:
# - contact-form-1729089000.js (Version A)
# - contact-form-1729090000.js (Version B)

# Use different Hugo shortcodes or routing to split traffic
# Track which version performs better
# Make winner the current snapshot
```

## Best Practices

### 1. Write Descriptive Change Summaries

When creating snapshots, provide clear descriptions:

```yaml
changes: 'Added phone field and updated success message'
# Better than: "Updated form"
```

### 2. Test Before Deploying

```bash
# Always test locally first
emma build contact-form
emma preview contact-form

# Verify form works correctly
# Then deploy
emma deploy contact-form
```

### 3. Keep Snapshot History Clean

While snapshots are cheap to store, consider your needs:

- Development: Keep all snapshots for debugging
- Production: Archive very old snapshots (manual cleanup)
- Most forms: Keep last 10-20 snapshots

### 4. Document Major Changes

For significant updates, add details to your form documentation:

```yaml
# In form YAML or separate docs
snapshots:
  - timestamp: 1729089000
    changes: 'Added phone field - requested by sales team, ticket #123'
```

### 5. Coordinate with Teammates

When working in a team:

- Pull latest form YAML before editing
- Communicate major changes
- Use version control for form YAML files
- Document deployment decisions

## Comparing Snapshots

While Emma doesn't have a built-in diff tool yet, you can compare snapshots manually:

```bash
# View specific snapshot configuration
cat ~/.emma/forms/contact-form.yaml

# Compare two snapshots
emma build contact-form --snapshot 1727780400
emma build contact-form --snapshot 1729089000

# Compare the built files
diff ~/.emma/builds/contact-form-1727780400/form.js \
     ~/.emma/builds/contact-form-1729089000/form.js
```

## Troubleshooting

### Snapshot Not Deploying

```bash
# Ensure snapshot exists in history
emma history contact-form

# Rebuild snapshot
emma build contact-form --snapshot 1729089000

# Deploy again
emma deploy contact-form --snapshot 1729089000
```

### Lost Snapshot History

If form YAML is corrupted:

1. Check version control for previous version
2. Restore from backup
3. R2 bundles remain intact - can manually reconstruct history

### Submissions Not Showing Correct Fields

Check submission's `form_snapshot` matches expected snapshot:

- View submission metadata
- Compare with `emma history contact-form`
- Verify R2 bundle exists for that snapshot

## Advanced Topics

### Manual Snapshot Creation

While `emma edit` handles this automatically, you can manually edit form YAML:

```yaml
snapshots:
  - timestamp: 1729089000
    deployed: false # Mark as not yet deployed
    storageKey: contact-form-1729089000.js
    changes: 'Manual snapshot for testing'
```

Then build and deploy:

```bash
emma build contact-form --snapshot 1729089000
emma deploy contact-form --snapshot 1729089000
```

### Snapshot Naming Conventions

Timestamps are UTC Unix timestamps. Convert to human-readable:

```bash
# Unix timestamp to date
date -d @1729089000
# Output: 2025-10-16 14:30:00 UTC

# Date to Unix timestamp
date -d "2025-10-16 14:30:00 UTC" +%s
# Output: 1729089000
```

### Cleaning Up Old Snapshots

To remove very old snapshots (manual process):

1. Backup form YAML
2. Remove old snapshot entries from YAML
3. Delete corresponding R2 bundles
4. Verify submissions using old snapshots (if any)

## Related Documentation

- [CLI Reference](./cli-reference.md) - Commands for working with forms
- [Deployment Guide](./deployment.md) - How to deploy forms and snapshots
- [Architectural Decisions](../05-architectural-decisions.md#3-form-versioning-strategy) - Technical details of snapshot system
- [Environment Setup](./environment-setup.md) - Setting up your environment

## Next Steps

Now that you understand snapshots:

1. Create your first form: `emma create my-form`
2. Practice editing: `emma edit my-form`
3. View history: `emma history my-form`
4. Deploy: `emma deploy my-form`
5. Try rollback: `emma deploy my-form --snapshot <previous>`
