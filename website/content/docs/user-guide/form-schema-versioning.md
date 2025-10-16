---
title: "Form Schema Versioning"
weight: 9
---

Emma uses a snapshot-based approach to versioning forms, which provides a simple yet powerful way to manage changes over time.

## Snapshots

Every time you edit a form, Emma creates a new, immutable snapshot of the form's schema. Each snapshot is identified by a timestamp and is stored as a separate asset in your R2 bucket. This means that every version of your form is independently deployable.

## Viewing Form History

You can view the history of a form, including all its snapshots, using the `emma history` command:

```bash
emma history my-contact-form
```

This will display a list of all the snapshots for the specified form, along with their timestamps and a summary of the changes.

## Deploying a Specific Snapshot

By default, `emma deploy` deploys the latest snapshot of a form. However, you can deploy a specific snapshot using the `--snapshot` option:

```bash
emma deploy my-contact-form --snapshot <timestamp>
```

This allows you to easily roll back to a previous version of a form if needed.

## Breaking Changes

For minor changes, such as updating a field label or a validation message, you can simply edit the form to create a new snapshot. For major changes, such as adding or removing a required field, it is recommended to create a new form to avoid data inconsistencies.