---
menu:
  docs:
    parent: 'user-guide'
title: 'CLI Command Reference'
weight: 7
---
menu:
  docs:
    parent: 'user-guide'

This section provides a detailed reference for all available `emma` commands.

### `emma init`

Initializes your project and deploys the necessary infrastructure to Cloudflare.

**Options:**

- `--override`: Re-runs the initialization process, overriding any existing configuration.

### `emma create <form-id>`

Creates a new form with the specified ID. This command opens an interactive prompt to define the form fields.

### `emma preview <form-id>`

Starts a local web server to preview your form.

### `emma deploy <form-id>`

Deploys your form to the configured target.

**Options:**

- `--target <target>`: Specifies the deployment target (e.g., `cloudflare`).
- `--snapshot <timestamp>`: Deploys a specific snapshot of the form.

### `emma list`

Lists all the forms in your project.

### `emma delete <form-id>`

Deletes a form from your project.

### `emma history <form-id>`

Shows the version history of a form, listing all the available snapshots.
