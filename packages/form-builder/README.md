# Emma Form Builder (TUI)

Terminal User Interface for creating and managing embeddable forms.

## Overview

The Form Builder is a command-line application that allows developers to:

- Create form schemas interactively
- Apply themes and styling
- Build form JavaScript bundles
- Deploy forms to Cloudflare R2
- Manage existing forms

## Installation

```bash
npm install -g @emma/form-builder
```

## Usage

```bash
# Initialize configuration
emma init

# Create a new form
emma create contact-form

# List all forms
emma list

# Build a form bundle
emma build contact-form-001

# Deploy to production
emma deploy contact-form-001

# Preview locally
emma preview contact-form-001
```

## Technology Stack

- TypeScript
- Ink (React for CLI) or Inquirer.js
- Commander.js
- Cloudflare API SDK
- Rollup/esbuild for bundling

## Development

```bash
npm install
npm run dev
```

## Documentation

See [/docs/02-technical-architecture.md](../../docs/02-technical-architecture.md) for detailed architecture.
