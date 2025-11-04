---
title: 'CLI Command Reference'
weight: 7
---

Complete command-line interface reference for Emma Forms.

## Installation

```bash
# Install globally
npm install -g @emma/form-builder
```

## Commands

### `emma init`

Initializes your project and deploys the necessary infrastructure to your chosen provider.

```bash
emma init [--override]
```

**Options:**

- `--override`: Re-runs the initialization process, overriding any existing configuration.

**What it does:**

1. Prompts you to select a deployment provider (e.g., Cloudflare)
2. Verifies required environment variables are set
3. Deploys infrastructure (storage bucket, API worker, database)
4. Saves configuration to `~/.emma/config.json`

### `emma create <form-name>`

Creates a new form with the specified name. Opens an interactive prompt to define form fields, validation, and options.

```bash
emma create contact-form
```

This generates a form schema (YAML) and assigns a unique ID with version (e.g., `contact-form-001`).

### `emma list`

Lists all forms in your project.

```bash
emma list [--detailed]
```

**Options:**

- `--detailed`: Shows additional information about each form

### `emma build <form-id>`

Builds the JavaScript bundle for a form.

```bash
emma build contact-form-001
```

Creates optimized bundles in `~/.emma/builds/<form-id>/`

### `emma preview <form-id>`

Starts a local web server to preview your form.

```bash
emma preview contact-form-001
```

Opens the form in your default browser at `http://localhost:3333`

### `emma deploy <form-id>`

Deploys your form to the configured target provider.

```bash
emma deploy contact-form-001 [options]
```

**Options:**

- `--target <provider>`: Specifies the deployment target (e.g., `cloudflare`)
- `--snapshot <timestamp>`: Deploys a specific snapshot of the form

### `emma delete <form-id>`

Deletes a form from your project.

```bash
emma delete contact-form-001
```

### `emma history <form-id>`

Shows the version history of a form, listing all available snapshots.

```bash
emma history contact-form-001
```

## Configuration

Emma stores forms and configuration in `~/.emma/`:

```
~/.emma/
├── config.json         # Global configuration
├── forms/              # Form schemas (YAML)
└── builds/             # Built form bundles
```

## Environment Variables

Depending on your provider, you may need to set environment variables:

**Cloudflare:**
```bash
export CLOUDFLARE_API_TOKEN="your-token"
export R2_ACCESS_KEY_ID="your-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-key"
```

See [Cloudflare Setup](../developer-guide/cloudflare-setup.md) for details.
