# Form Change Strategies

**Document Type:** Best Practices Guide
**Date:** October 18, 2025
**Status:** Final

## Overview

Emma's snapshot-based versioning system allows you to evolve forms without breaking existing data. However, choosing between editing an existing form versus creating a new one has important implications. This guide helps you make the right decision.

## Core Principle: No Migrations Required

Emma is designed to **never require database migrations** when forms change. This is achieved by:

1. **Snapshot Tracking**: Each submission stores which form snapshot was used
2. **Immutable Data**: Submitted data is never modified
3. **Display-Time Resolution**: The viewer handles field differences
4. **N/A for Missing**: Fields that didn't exist show as "N/A"

## Decision Tree

```
┌─────────────────────────────────┐
│  Need to change a form?         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Is the change breaking?             │
│ (Changes meaning of existing data)  │
└────────┬────────────────┬───────────┘
         │ NO             │ YES
         ▼                ▼
    ┌────────┐      ┌──────────┐
    │ EDIT   │      │ CREATE   │
    │ (Minor)│      │ (Major)  │
    └────────┘      └──────────┘
```

## Minor Changes (Edit Existing Form)

### When to Edit

Use `emma edit <form-id>` for **non-breaking changes**:

✅ **Add new fields**

```yaml
# Before (snapshot 1729089000)
fields:
  - id: name
  - id: email

# After (snapshot 1729189000)
fields:
  - id: name
  - id: email
  - id: phone  # NEW FIELD
```

✅ **Remove optional fields**

```yaml
# Before
fields:
  - id: name
  - id: email
  - id: newsletter (optional)

# After
fields:
  - id: name
  - id: email
  # newsletter removed
```

✅ **Update labels or help text**

```yaml
# Before
- id: email
  label: 'Email'

# After
- id: email
  label: 'Email Address'
  helpText: "We'll never share your email"
```

✅ **Change validation rules (less strict)**

```yaml
# Before
- id: age
  validation:
    min: 18
    max: 65

# After
- id: age
  validation:
    min: 13 # Less strict
    max: 100
```

✅ **Adjust field order**

```yaml
# Order changes don't affect data
```

### Impact of Minor Changes

**Positive**:

- ✅ All submissions under one form ID
- ✅ Single form to manage
- ✅ Continuous submission history
- ✅ Easy to track form evolution

**Considerations**:

- ⚠️ Old submissions show "N/A" for new fields
- ⚠️ Removed fields show in old submissions
- ⚠️ Viewer must handle mixed field sets

**Example Workflow**:

```bash
# Edit the form
emma edit contact-form
# Follow prompts to add phone field
# Description: "Added phone number field"

# Build new snapshot
emma build contact-form

# Deploy
emma deploy cloudflare contact-form

# View history
emma history contact-form
# Shows:
# Snapshot 2: 1729189000 - "Added phone number field"
# Snapshot 1: 1729089000 - "Initial version"
```

## Major Changes (Create New Form)

### When to Create a New Form

Use `emma create <new-form-id>` for **breaking changes**:

❌ **Change field meaning**

```yaml
# BAD: Editing existing form
# Before
- id: age
  type: number
  label: 'Age'

# After - WRONG APPROACH
- id: age
  type: text
  label: 'Age Range' # Now expects "18-25" not "23"

# GOOD: Create new form
# contact-form-v2:
- id: age_range
  type: select
  options:
    - '18-25'
    - '26-35'
```

❌ **Restructure data collection**

```yaml
# BAD: Major restructure in same form
# Before
- id: address
  type: textarea

# After - WRONG APPROACH
- id: street
  type: text
- id: city
  type: text
- id: state
  type: text
# Old submissions have "address", new have "street/city/state"

# GOOD: Create contact-form-v2 with new structure
```

❌ **Change target audience**

```yaml
# Before: contact-form (general public)
- id: name
- id: email
- id: message

# After - WRONG APPROACH: Same form for customers
- id: customer_id # Doesn't make sense for old submissions
- id: account_number
- id: support_request
# GOOD: Create customer-support-form
```

❌ **Completely different purpose**

```yaml
# Before: Contact form
# After: Job application form
# GOOD: Create jobs-application-form
```

### Impact of Major Changes

**Creating a New Form**:

- ✅ Clear separation of data
- ✅ No confusion about field meanings
- ✅ Clean data model
- ✅ Easier to analyze submissions

**Drawbacks**:

- ⚠️ Two forms to manage
- ⚠️ Must update website to use new form ID
- ⚠️ Split submission history

**Example Workflow**:

```bash
# Create new form
emma create contact-form-v2

# Configure new structure in TUI
# ...

# Build and deploy
emma build contact-form-v2
emma deploy cloudflare contact-form-v2

# Update website
# OLD: <div data-emma-form="contact-form"></div>
# NEW: <div data-emma-form="contact-form-v2"></div>

# Keep old form for historical data
# Don't delete contact-form - submissions still reference it
```

## Practical Examples

### Example 1: Newsletter Signup Evolution

**Scenario**: Newsletter form needs GDPR consent checkbox.

**Decision**: ✅ **EDIT** (Minor change - adding field)

```bash
emma edit newsletter-signup
# Add field: gdpr_consent (checkbox, required)
# Description: "Added GDPR consent checkbox"
```

**Result**:

- Old submissions: `gdpr_consent: N/A` (pre-GDPR)
- New submissions: `gdpr_consent: true` (explicit consent)
- All submissions under one form ID
- Can filter by snapshot to separate pre/post GDPR

### Example 2: Contact Form Becomes Support Ticket

**Scenario**: Contact form needs to become full support ticket system.

**Decision**: ❌ **CREATE** (Major change - different purpose)

**Before** (`contact-form`):

```yaml
fields:
  - id: name
  - id: email
  - id: message
```

**After** (`support-tickets`):

```yaml
fields:
  - id: customer_id
  - id: ticket_type
  - id: priority
  - id: issue_description
  - id: affected_system
```

**Reasoning**:

- Completely different field structure
- Different data meaning
- Different audience (customers vs. general public)
- Would confuse historical data

### Example 3: Event Registration Changes

**Scenario**: Annual event registration form needs updates.

**Option A**: Year-specific forms ✅

```
event-2024
event-2025
event-2026
```

**Option B**: Single form with snapshots ✅

```
annual-event-registration
  ├─ Snapshot 1729089000 (2024 version)
  ├─ Snapshot 1729189000 (2025 version)
  └─ Snapshot 1729289000 (2026 version)
```

**Recommendation**: **Option B** if field changes are minor (dates, pricing tiers).
**Option A** if events are fundamentally different.

### Example 4: A/B Testing

**Scenario**: Testing two form designs.

**Decision**: ❌ **CREATE** (Need separate forms for A/B test)

```
contact-form-variant-a
contact-form-variant-b
```

**After testing**, consolidate winners:

```bash
# If variant B wins, make it the main form
# Update website to use contact-form-variant-b
# Or create new contact-form-v2 based on winner
```

## Migration Strategy

### Sunsetting Old Forms

When you create a new form version:

1. **Deploy New Form**:

```bash
emma create contact-form-v2
emma build contact-form-v2
emma deploy cloudflare contact-form-v2
```

2. **Update Website** (gradual rollout):

```html
<!-- Phase 1: Deploy both, route traffic 50/50 -->
<div data-emma-form="contact-form" class="form-a"></div>
<div data-emma-form="contact-form-v2" class="form-b"></div>

<!-- Phase 2: After testing, use only v2 -->
<div data-emma-form="contact-form-v2"></div>
```

3. **Keep Old Form Active**:

- Do NOT delete old form
- Historical submissions reference it
- May need to display old form for reference

4. **Archive Old Form** (optional):

```bash
# Mark as inactive in database (future feature)
# But keep form definition for historical reference
```

## Analyzing Submissions Across Changes

### Viewing Mixed Snapshots

**List by snapshot**:

```bash
# View all submissions
curl https://api.example.com/submissions?formId=contact-form

# See grouped response
{
  "grouped": {
    "contact-form": {
      "snapshots": {
        "1729089000": { "count": 150 },
        "1729189000": { "count": 200 }
      }
    }
  }
}
```

### Exporting for Analysis

**Separate by snapshot**:

```bash
# Export old snapshot
curl "https://api.example.com/submissions/export?formId=contact-form&snapshot=1729089000" \
  -o old-version.csv

# Export new snapshot
curl "https://api.example.com/submissions/export?formId=contact-form&snapshot=1729189000" \
  -o new-version.csv
```

**Combined export**:

```bash
# All snapshots together
curl "https://api.example.com/submissions/export?formId=contact-form" \
  -o all-versions.csv
```

The CSV will show:

```csv
"name","email","phone","form_snapshot","form_bundle"
"John","john@example.com","N/A","1729089000","contact-form-1729089000.js"
"Jane","jane@example.com","555-1234","1729189000","contact-form-1729189000.js"
```

## Best Practices Summary

### ✅ DO: Edit for Minor Changes

- Adding optional fields
- Removing optional fields
- Updating labels/help text
- Relaxing validations
- Cosmetic changes

### ❌ DON'T: Edit for Major Changes

- Changing field meanings
- Complete restructuring
- Different target audience
- Different purpose
- Breaking data compatibility

### 🔍 When in Doubt

If you're unsure, ask:

1. **Can old and new submissions be meaningfully compared?**
   - YES → Edit
   - NO → Create new form

2. **Do the fields mean the same thing?**
   - YES → Edit
   - NO → Create new form

3. **Is this the same form, evolved?**
   - YES → Edit
   - NO → Create new form

## See Also

- [Submission Viewing Guide](./submission-viewing-guide.md) - Handling mixed snapshots
- [Export Format Guide](./export-format.md) - Exporting data across snapshots
- [CLI Command Reference](../user-guide/cli-command-reference.md) - `emma edit` and `emma create`
- [Snapshot Versioning](../user-guide/form-schema-versioning.md) - Understanding snapshots
- [Architectural Decisions](../05-architectural-decisions.md) - Why this approach
